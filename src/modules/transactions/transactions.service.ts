import { Injectable } from "@nestjs/common";

import { Prisma, Transaction } from "../../prisma/generated";
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
    const where: Prisma.TransactionWhereInput = {};

    if (dto.payment_type) {
      where.paymentType = dto.payment_type;
    }

    if (dto.transaction_type) {
      where.transactionType = dto.transaction_type;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
        where,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items,
      limit: params.limit,
      page: params.page,
      total,
    };
  }
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
