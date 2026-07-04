import { BadRequestException } from "@nestjs/common";

export class InvalidRecordException extends BadRequestException {
  constructor(message = "invalid record") {
    super(message);
  }
}
