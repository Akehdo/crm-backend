import { Injectable } from "@nestjs/common";

import { Prisma, Transaction, TransactionType } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
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
    validateTransactionDto(dto);

    try {
      return await this.prisma.transaction.create({
        data: {
          amount: dto.amount,
          expenseId: normalizeOptionalId(dto.expense_id),
          paymentType: dto.payment_type,
          recordId: normalizeOptionalId(dto.record_id),
          transactionType: dto.transaction_type,
        },
      });
    } catch (error) {
      if (isForeignKeyError(error)) {
        throw new TransactionSourceNotFoundException();
      }

      throw error;
    }
  }

  async list(dto: ListTransactionsDto): Promise<ListTransactionsResult> {
    const params = createPaginationParams(dto.page, dto.limit);
    const where = buildTransactionWhere(dto, { includeTransactionType: true });
    const summaryWhere = buildTransactionWhere(dto, {
      includeTransactionType: false,
    });

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

    const income = shouldIncludeSummaryType(dto, TransactionType.INCOME)
      ? incomeAggregate._sum.amount ?? 0
      : 0;
    const expense = shouldIncludeSummaryType(dto, TransactionType.EXPENSE)
      ? expenseAggregate._sum.amount ?? 0
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

type BuildTransactionWhereOptions = {
  includeTransactionType: boolean;
};

function buildTransactionWhere(
  dto: ListTransactionsDto,
  options: BuildTransactionWhereOptions,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};

  if (dto.payment_type) {
    where.paymentType = dto.payment_type;
  }

  if (options.includeTransactionType && dto.transaction_type) {
    where.transactionType = dto.transaction_type;
  }

  const createdAt = buildCreatedAtFilter(dto);
  if (createdAt) {
    where.createdAt = createdAt;
  }

  return where;
}

function buildCreatedAtFilter(
  dto: ListTransactionsDto,
): Prisma.DateTimeFilter | undefined {
  const createdAt: Prisma.DateTimeFilter = {};

  if (dto.date_from) {
    createdAt.gte = parseDateStart(dto.date_from);
  }

  if (dto.date_to) {
    createdAt.lt = parseNextDateStart(dto.date_to);
  }

  return Object.keys(createdAt).length > 0 ? createdAt : undefined;
}

function parseDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseNextDateStart(value: string): Date {
  const date = parseDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function shouldIncludeSummaryType(
  dto: ListTransactionsDto,
  transactionType: TransactionType,
): boolean {
  return !dto.transaction_type || dto.transaction_type === transactionType;
}

function validateTransactionDto(dto: CreateTransactionDto): void {
  if (dto.amount <= 0) {
    throw new InvalidTransactionException("amount must be positive");
  }

  const hasRecordId = Boolean(normalizeOptionalId(dto.record_id));
  const hasExpenseId = Boolean(normalizeOptionalId(dto.expense_id));

  if (hasRecordId && hasExpenseId) {
    throw new InvalidTransactionException(
      "only one transaction source can be provided",
    );
  }
}

function normalizeOptionalId(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
