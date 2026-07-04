import { ConflictException } from "@nestjs/common";

export class RecordAlreadyExistsException extends ConflictException {
  constructor() {
    super("record already exists");
  }
}
