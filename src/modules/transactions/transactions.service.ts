import { Injectable } from "@nestjs/common";

import { Prisma, Transaction, TransactionType } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { toMoneyNumber } from "../../shared/money";
import { createPaginationParams } from "../../shared/pagination";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { ListTransactionsDto } from "./dto/list-transactions.dto";
import { InvalidTransactionException } from "./exceptions/invalid-transaction.exception";
import { TransactionSourceNotFoundException } from "./exceptions/transaction-source-not-found.exception";
import { ListTransactionsResult } from "./types/transactions.types";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    // Validate numeric fields first, before touching optional source ids.
    if (dto.amount <= 0) {
      throw new InvalidTransactionException("amount must be positive");
    }

    // Normalize optional ids once and reuse the normalized values for create.
    const recordId = dto.record_id?.trim() || undefined;
    const expenseId = dto.expense_id?.trim() || undefined;

    if (recordId && expenseId) {
      throw new InvalidTransactionException(
        "only one transaction source can be provided",
      );
    }

    try {
      return await this.prisma.transaction.create({
        data: {
          amount: dto.amount,
          expenseId,
          paymentType: dto.payment_type,
          recordId,
          transactionType: dto.transaction_type,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new TransactionSourceNotFoundException();
      }

      throw error;
    }
  }

  async list(dto: ListTransactionsDto): Promise<ListTransactionsResult> {
    const params = createPaginationParams(dto.page, dto.limit);

    // Build the full list filter from the query dto.
    const where: Prisma.TransactionWhereInput = {};

    if (dto.payment_type) {
      where.paymentType = dto.payment_type;
    }

    if (dto.transaction_type) {
      where.transactionType = dto.transaction_type;
    }

    // Date filtering is inclusive for date_to by using the next day as lt.
    const createdAt: Prisma.DateTimeFilter = {};

    if (dto.date_from) {
      createdAt.gte = new Date(`${dto.date_from}T00:00:00.000Z`);
    }

    if (dto.date_to) {
      const nextDate = new Date(`${dto.date_to}T00:00:00.000Z`);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      createdAt.lt = nextDate;
    }

    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }

    // Summary totals reuse date/payment filters but ignore selected type.
    const summaryWhere: Prisma.TransactionWhereInput = {};

    if (dto.payment_type) {
      summaryWhere.paymentType = dto.payment_type;
    }

    if (Object.keys(createdAt).length > 0) {
      summaryWhere.createdAt = createdAt;
    }

    const [items, total, incomeAggregate, expenseAggregate] =
      await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          orderBy: { createdAt: "desc" },
          skip: params.offset,
          take: params.limit,
          where,
        }),
        this.prisma.transaction.count({ where }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            ...summaryWhere,
            transactionType: TransactionType.INCOME,
          },
        }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            ...summaryWhere,
            transactionType: TransactionType.EXPENSE,
          },
        }),
      ]);

    const income =
      !dto.transaction_type || dto.transaction_type === TransactionType.INCOME
        ? toMoneyNumber(incomeAggregate._sum.amount ?? 0)
        : 0;
    const expense =
      !dto.transaction_type || dto.transaction_type === TransactionType.EXPENSE
        ? toMoneyNumber(expenseAggregate._sum.amount ?? 0)
        : 0;

    return {
      items,
      limit: params.limit,
      page: params.page,
      summary: {
        balance: income - expense,
        expense,
        income,
      },
      total,
    };
  }
}
