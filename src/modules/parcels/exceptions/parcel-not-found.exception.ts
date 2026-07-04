import { NotFoundException } from "@nestjs/common";

export class ParcelNotFoundException extends NotFoundException {
  constructor() {
    super("parcel not found");
  }
}
