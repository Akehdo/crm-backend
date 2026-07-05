import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExpensesService } from "./expenses.service";

describe("ExpensesService", () => {
  it("deletes linked transactions in the same transaction as the expense", async () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const deletedExpense = { id };
    const operations: unknown[] = [];

    const prisma = {
      $transaction: async (items: unknown[]) => {
        assert.deepEqual(items, operations);
        return [{ count: 1 }, deletedExpense];
      },
      expense: {
        delete: (args: unknown) => {
          const operation = { args, model: "expense", operation: "delete" };
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

    const service = new ExpensesService(prisma as never);

    assert.strictEqual(await service.delete(id), deletedExpense);
    assert.deepEqual(operations, [
      {
        args: { where: { expenseId: id } },
        model: "transaction",
        operation: "deleteMany",
      },
      {
        args: { where: { id } },
        model: "expense",
        operation: "delete",
      },
    ]);
  });
});
