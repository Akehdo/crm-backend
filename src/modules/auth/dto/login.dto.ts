import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "must be a valid email" })
  email!: string;

  @IsString({ message: "invalid value" })
  @IsNotEmpty({ message: "field is required" })
  password!: string;
}
