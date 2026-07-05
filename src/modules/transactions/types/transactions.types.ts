import { Transaction } from "../../../prisma/generated";

export type ListTransactionsResult = {
  items: Transaction[];
  limit: number;
  page: number;
  total: number;
};
