import { BadRequestException } from "@nestjs/common";

export class InvalidExpenseException extends BadRequestException {
  constructor(message: string) {
    super({
      error: {
        code: "INVALID_EXPENSE",
        message,
      },
    });
  }
}
