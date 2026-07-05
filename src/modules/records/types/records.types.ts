import { Record as RecordModel, Transaction } from "../../../prisma/generated";

export type RecordWithTransactions = RecordModel & {
  transactions?: Transaction[];
};

export type ListRecordsResult = {
  items: RecordWithTransactions[];
  limit: number;
  page: number;
  total: number;
};
