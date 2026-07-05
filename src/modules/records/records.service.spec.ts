import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
});
