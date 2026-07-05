import { NotFoundException } from "@nestjs/common";

export class TransactionSourceNotFoundException extends NotFoundException {
  constructor() {
    super({
      error: {
        code: "TRANSACTION_SOURCE_NOT_FOUND",
        message: "transaction source not found",
      },
    });
  }
}
