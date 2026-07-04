import { NotFoundException } from "@nestjs/common";

export class ExpenseNotFoundException extends NotFoundException {
  constructor() {
    super({
      error: {
        code: "EXPENSE_NOT_FOUND",
        message: "expense not found",
      },
    });
  }
}
