import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PaymentType, TransactionType } from "../../prisma/generated";
import { InvalidRecordException } from "./exceptions/invalid-record.exception";
import { RecordsService } from "./records.service";

describe("RecordsService", () => {
  it("deletes linked transactions in the same transaction as the record", async () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const deletedRecord = { id };
    const operations: unknown[] = [];

    const prisma = {
      $transaction: async (items: unknown[]) => {
        assert.deepEqual(items, operations);
        return [{ count: 1 }, deletedRecord];
      },
      record: {
        delete: (args: unknown) => {
          const operation = { args, model: "record", operation: "delete" };
          operations.push(operation);
          return operation;
        },
      },
      transaction: {
        deleteMany: (args: unknown) => {
          const operation = {
            args,
            model: "transaction",
            operation: "deleteMany",
          };
          operations.push(operation);
          return operation;
        },
      },
    };

    const service = new RecordsService(prisma as never);

    assert.strictEqual(await service.delete(id), deletedRecord);
    assert.deepEqual(operations, [
      {
        args: { where: { recordId: id } },
        model: "transaction",
        operation: "deleteMany",
      },
      {
        args: { where: { id } },
        model: "record",
        operation: "delete",
      },
    ]);
  });

  it("creates legacy single-payment records from payment_type", async () => {
    const createdRecord = { id: "record-id" };
    let createArgs: unknown;

    const prisma = {
      record: {
        create: async (args: unknown) => {
          createArgs = args;
          return createdRecord;
        },
      },
    };

    const service = new RecordsService(prisma as never);

    assert.strictEqual(
      await service.create({
        client_code: 1001,
        payment_type: PaymentType.cash,
        price: 4000,
        track_numbers: [" A100 ", "A100", "B200"],
        weight: 2,
      }),
      createdRecord,
    );

    assert.deepEqual(createArgs, {
      data: {
        clientCode: 1001n,
        paymentType: PaymentType.cash,
        price: 4000,
        trackNumbers: ["A100", "B200"],
        transactions: {
          create: [
            {
              amount: 4000,
              paymentType: PaymentType.cash,
              transactionType: TransactionType.INCOME,
            },
          ],
        },
        weight: 2,
      },
      include: {
        transactions: {
          orderBy: { createdAt: "asc" },
          where: { transactionType: TransactionType.INCOME },
        },
      },
    });
  });

  it("rejects split payments when the total does not equal price", async () => {
    const service = new RecordsService({} as never);

    await assert.rejects(
      () =>
        service.create({
          client_code: 1001,
          payments: [
            { amount: 2000, payment_type: PaymentType.kaspiQR },
            { amount: 1500, payment_type: PaymentType.cash },
          ],
          price: 4000,
          track_numbers: ["A100"],
          weight: 2,
        }),
      InvalidRecordException,
    );
  });

  it("updates split payments by replacing income transactions", async () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const updatedRecord = { id };
    let updateArgs: unknown;

    const prisma = {
      record: {
        update: async (args: unknown) => {
          updateArgs = args;
          return updatedRecord;
        },
      },
    };

    const service = new RecordsService(prisma as never);

    assert.strictEqual(
      await service.update(id, {
        payments: [
          { amount: 2000, payment_type: PaymentType.kaspiQR },
          { amount: 2000, payment_type: PaymentType.cash },
        ],
        price: 4000,
      }),
      updatedRecord,
    );

    assert.deepEqual(updateArgs, {
      data: {
        paymentType: PaymentType.kaspiQR,
        price: 4000,
        transactions: {
          create: [
            {
              amount: 2000,
              paymentType: PaymentType.kaspiQR,
              transactionType: TransactionType.INCOME,
            },
            {
              amount: 2000,
              paymentType: PaymentType.cash,
              transactionType: TransactionType.INCOME,
            },
          ],
          deleteMany: {
            transactionType: TransactionType.INCOME,
          },
        },
      },
      include: {
        transactions: {
          orderBy: { createdAt: "asc" },
          where: { transactionType: TransactionType.INCOME },
        },
      },
      where: { id },
    });
  });
});
