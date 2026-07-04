import { PaymentType as PaymentTypeEnum } from "../../prisma/generated";

export { PaymentTypeEnum };

export const PAYMENT_TYPES = [
  PaymentTypeEnum.kaspiQR,
  PaymentTypeEnum.card,
  PaymentTypeEnum.cash,
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];
