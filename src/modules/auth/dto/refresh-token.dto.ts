import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @IsString({ message: "invalid value" })
  @IsNotEmpty({ message: "field is required" })
  refresh_token!: string;
}
