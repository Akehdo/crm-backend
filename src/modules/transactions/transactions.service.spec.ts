import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PaymentType, TransactionType } from "../../prisma/generated";
import { TransactionsService } from "./transactions.service";

type TransactionWhereForTest = {
  createdAt?: {
    gte?: Date;
    lt?: Date;
  };
  paymentType?: PaymentType;
  transactionType?: TransactionType;
};

type PrismaOperationArgs = {
  _sum?: unknown;
  orderBy?: unknown;
  skip?: number;
  take?: number;
  where?: TransactionWhereForTest;
};

type PrismaOperation = {
  args: PrismaOperationArgs;
  operation: string;
};

describe("TransactionsService", () => {
  it("builds list filters, inclusive date range, and summary totals", async () => {
    const operations: PrismaOperation[] = [];

    const prisma = {
      $transaction: async (items: unknown[]) => {
        assert.deepEqual(items, operations);
        return [[], 2, { _sum: { amount: 1000 } }, { _sum: { amount: 400 } }];
      },
      transaction: {
        aggregate: (args: PrismaOperationArgs) => {
          const operation = { args, operation: "aggregate" };
          operations.push(operation);
          return operation;
        },
        count: (args: PrismaOperationArgs) => {
          const operation = { args, operation: "count" };
          operations.push(operation);
          return operation;
        },
        findMany: (args: PrismaOperationArgs) => {
          const operation = { args, operation: "findMany" };
          operations.push(operation);
          return operation;
        },
      },
    };

    const service = new TransactionsService(prisma as never);

    const result = await service.list({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
      limit: 10,
      page: 2,
      payment_type: PaymentType.cash,
      transaction_type: TransactionType.INCOME,
    });

    const listWhere = operations[0].args.where;
    assert.equal(listWhere?.paymentType, PaymentType.cash);
    assert.equal(listWhere?.transactionType, TransactionType.INCOME);
    assert.equal(
      listWhere?.createdAt?.gte?.toISOString(),
      "2026-07-01T00:00:00.000Z",
    );
    assert.equal(
      listWhere?.createdAt?.lt?.toISOString(),
      "2026-08-01T00:00:00.000Z",
    );

    assert.equal(operations[0].args.skip, 10);
    assert.equal(operations[0].args.take, 10);
    assert.equal(
      operations[2].args.where?.transactionType,
      TransactionType.INCOME,
    );
    assert.equal(
      operations[3].args.where?.transactionType,
      TransactionType.EXPENSE,
    );

    assert.deepEqual(result.summary, {
      balance: 1000,
      expense: 0,
      income: 1000,
    });
  });
});
