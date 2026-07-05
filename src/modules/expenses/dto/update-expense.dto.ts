import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

import { PaymentType } from "../../../prisma/generated";

export class UpdateExpenseDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "invalid value" })
  @Min(0.01, { message: "invalid value" })
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentType, { message: "invalid value" })
  payment_type?: PaymentType;

  @IsOptional()
  @IsString({ message: "invalid value" })
  @MaxLength(255, { message: "invalid value" })
  comment?: string;
}
