import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PaymentType } from "../../generated/prisma/enums";
import { InvalidRecordException } from "./exceptions/invalid-record.exception";
import { buildRecordPayments, isSameAmount } from "./records.payments";

describe("buildRecordPayments", () => {
  it("uses fallback payment type for legacy single-payment records", () => {
    const payments = buildRecordPayments(undefined, 4000, {
      fallbackPaymentType: PaymentType.cash,
    });

    assert.deepEqual(payments, [
      {
        amount: 4000,
        payment_type: PaymentType.cash,
      },
    ]);
  });

  it("accepts split payments when the total equals price", () => {
    const payments = buildRecordPayments(
      [
        { amount: 2000, payment_type: PaymentType.kaspiQR },
        { amount: 2000, payment_type: PaymentType.cash },
      ],
      4000,
    );

    assert.equal(payments.length, 2);
  });

  it("rejects split payments when the total does not equal price", () => {
    assert.throws(
      () =>
        buildRecordPayments(
          [
            { amount: 2000, payment_type: PaymentType.kaspiQR },
            { amount: 1500, payment_type: PaymentType.cash },
          ],
          4000,
        ),
      InvalidRecordException,
    );
  });

  it("rejects duplicate payment types", () => {
    assert.throws(
      () =>
        buildRecordPayments(
          [
            { amount: 2000, payment_type: PaymentType.cash },
            { amount: 2000, payment_type: PaymentType.cash },
          ],
          4000,
        ),
      InvalidRecordException,
    );
  });
});

describe("isSameAmount", () => {
  it("allows tiny floating point differences", () => {
    assert.equal(isSameAmount(0.1 + 0.2, 0.3), true);
  });
});
