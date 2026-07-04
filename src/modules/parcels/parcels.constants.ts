import { ParcelStatus as ParcelStatusEnum } from "../../prisma/generated";

export { ParcelStatusEnum };

export const PARCEL_STATUSES = [
  ParcelStatusEnum.added,
  ParcelStatusEnum.shipped,
  ParcelStatusEnum.almaty,
  ParcelStatusEnum.koksh,
] as const;

export type ParcelStatus = (typeof PARCEL_STATUSES)[number];
