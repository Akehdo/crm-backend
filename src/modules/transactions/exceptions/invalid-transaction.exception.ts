import { BadRequestException } from "@nestjs/common";

export class InvalidTransactionException extends BadRequestException {
  constructor(message: string) {
    super({
      error: {
        code: "INVALID_TRANSACTION",
        message,
      },
    });
  }
}
