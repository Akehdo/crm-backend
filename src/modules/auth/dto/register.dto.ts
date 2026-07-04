import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "must be a valid email" })
  email!: string;

  @IsString({ message: "invalid value" })
  @IsNotEmpty({ message: "field is required" })
  @MinLength(8, { message: "must contain at least 8 characters" })
  @MaxLength(72, { message: "must contain no more than 72 characters" })
  password!: string;
}
