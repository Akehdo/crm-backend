import type { Prisma } from "../../prisma/generated";
import { TransactionType } from "../../generated/prisma/enums";
import type { ListTransactionsDto } from "./dto/list-transactions.dto";

export type BuildTransactionWhereOptions = {
  includeTransactionType: boolean;
};

export function buildTransactionWhere(
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

export function buildCreatedAtFilter(
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

export function parseDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function parseNextDateStart(value: string): Date {
  const date = parseDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export function shouldIncludeSummaryType(
  dto: ListTransactionsDto,
  transactionType: TransactionType,
): boolean {
  return !dto.transaction_type || dto.transaction_type === transactionType;
}
