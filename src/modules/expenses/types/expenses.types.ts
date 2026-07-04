import { Expense } from "../../../prisma/generated";

export type ListExpensesResult = {
  items: Expense[];
  limit: number;
  page: number;
  total: number;
};
