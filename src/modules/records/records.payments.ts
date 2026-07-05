import { PaymentType } from "../../generated/prisma/enums";
import { InvalidRecordException } from "./exceptions/invalid-record.exception";

export type RecordPaymentInput = {
  amount: number;
  payment_type: PaymentType;
};

type BuildRecordPaymentsOptions = {
  fallbackPaymentType?: PaymentType;
};

export function buildRecordPayments<TPayment extends RecordPaymentInput>(
  payments: TPayment[] | undefined,
  price: number | undefined,
  options: BuildRecordPaymentsOptions = {},
): TPayment[] | RecordPaymentInput[] {
  if (price === undefined || price <= 0) {
    throw new InvalidRecordException("price must be positive");
  }

  if (!payments || payments.length === 0) {
    if (!options.fallbackPaymentType) {
      throw new InvalidRecordException("payments are required");
    }

    return [{ amount: price, payment_type: options.fallbackPaymentType }];
  }

  const seenPaymentTypes = new Set<PaymentType>();

  for (const payment of payments) {
    if (payment.amount <= 0) {
      throw new InvalidRecordException("payment amount must be positive");
    }

    if (seenPaymentTypes.has(payment.payment_type)) {
      throw new InvalidRecordException("duplicate payment type");
    }

    seenPaymentTypes.add(payment.payment_type);
  }

  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (!isSameAmount(total, price)) {
    throw new InvalidRecordException("payments total must equal price");
  }

  return payments;
}

export function isSameAmount(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}
