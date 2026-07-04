import { ConflictException } from "@nestjs/common";

export class UserAlreadyExistsException extends ConflictException {
  constructor() {
    super("user already exists");
  }
}
