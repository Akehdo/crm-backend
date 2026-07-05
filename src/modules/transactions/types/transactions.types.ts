import { Transaction } from "../../../prisma/generated";

export type TransactionsSummary = {
  balance: number;
  expense: number;
  income: number;
};

export type ListTransactionsResult = {
  items: Transaction[];
  limit: number;
  page: number;
  summary: TransactionsSummary;
  total: number;
};
