import { Record as RecordModel } from "../../../prisma/generated";

export type ListRecordsResult = {
  items: RecordModel[];
  limit: number;
  page: number;
  total: number;
};
