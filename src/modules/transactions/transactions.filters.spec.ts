import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PaymentType, TransactionType } from "../../generated/prisma/enums";
import {
  buildCreatedAtFilter,
  buildTransactionWhere,
  parseNextDateStart,
  shouldIncludeSummaryType,
} from "./transactions.filters";

describe("transaction filters", () => {
  it("builds inclusive date range by using next day upper bound", () => {
    const createdAt = buildCreatedAtFilter({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
    });

    assert.equal(
      asDate(createdAt?.gte).toISOString(),
      "2026-07-01T00:00:00.000Z",
    );
    assert.equal(
      asDate(createdAt?.lt).toISOString(),
      "2026-08-01T00:00:00.000Z",
    );
  });

  it("builds full transaction where with type and payment filters", () => {
    const where = buildTransactionWhere(
      {
        date_from: "2026-07-01",
        payment_type: PaymentType.card,
        transaction_type: TransactionType.INCOME,
      },
      { includeTransactionType: true },
    );

    assert.equal(where.paymentType, PaymentType.card);
    assert.equal(where.transactionType, TransactionType.INCOME);
    assert.equal(
      Boolean(where.createdAt && typeof where.createdAt === "object"),
      true,
    );
  });

  it("can omit transaction type for summary queries", () => {
    const where = buildTransactionWhere(
      {
        payment_type: PaymentType.cash,
        transaction_type: TransactionType.EXPENSE,
      },
      { includeTransactionType: false },
    );

    assert.equal(where.paymentType, PaymentType.cash);
    assert.equal(where.transactionType, undefined);
  });

  it("respects selected summary type", () => {
    assert.equal(
      shouldIncludeSummaryType(
        { transaction_type: TransactionType.INCOME },
        TransactionType.INCOME,
      ),
      true,
    );
    assert.equal(
      shouldIncludeSummaryType(
        { transaction_type: TransactionType.INCOME },
        TransactionType.EXPENSE,
      ),
      false,
    );
  });

  it("returns the next UTC day for date_to", () => {
    assert.equal(
      parseNextDateStart("2026-07-31").toISOString(),
      "2026-08-01T00:00:00.000Z",
    );
  });
});

function asDate(value: unknown): Date {
  assert.ok(value instanceof Date);
  return value;
}
