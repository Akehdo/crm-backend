import { Parcel } from "@prisma/client";

export type CreateParcelsResult = {
  count: number;
};

export type ListParcelsResult = {
  items: Parcel[];
  limit: number;
  page: number;
  total: number;
};