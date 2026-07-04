import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateExpenseDto {
  @Type(() => Number)
  @IsNumber({}, { message: "invalid value" })
  @Min(0.01, { message: "invalid value" })
  amount!: number;

  @IsOptional()
  @IsString({ message: "invalid value" })
  @MaxLength(255, { message: "invalid value" })
  comment?: string;
}
