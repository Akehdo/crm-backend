import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

import { PaymentType, TransactionType } from "../../../prisma/generated";

export class ListTransactionsDto {
  @IsOptional()
  @IsEnum(TransactionType, { message: "invalid value" })
  transaction_type?: TransactionType;

  @IsOptional()
  @IsEnum(PaymentType, { message: "invalid value" })
  payment_type?: PaymentType;

  @IsOptional()
  @IsDateString({}, { message: "invalid value" })
  date_from?: string;

  @IsOptional()
  @IsDateString({}, { message: "invalid value" })
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "invalid value" })
  @Min(1, { message: "invalid value" })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "invalid value" })
  @Min(1, { message: "invalid value" })
  @Max(100, { message: "invalid value" })
  limit?: number;
}
