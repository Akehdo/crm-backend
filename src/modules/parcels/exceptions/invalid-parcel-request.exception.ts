import { BadRequestException } from "@nestjs/common";

export class InvalidParcelRequestException extends BadRequestException {
  constructor(message = "invalid parcel request") {
    super(message);
  }
}
