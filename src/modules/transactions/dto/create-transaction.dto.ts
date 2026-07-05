import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from "class-validator";

import { PaymentType, TransactionType } from "../../../prisma/generated";

export class CreateTransactionDto {
  @IsEnum(TransactionType, { message: "invalid value" })
  transaction_type!: TransactionType;

  @IsEnum(PaymentType, { message: "invalid value" })
  payment_type!: PaymentType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "invalid value" })
  @Min(0.01, { message: "invalid value" })
  amount!: number;

  @IsOptional()
  @ValidateIf((dto: CreateTransactionDto) => dto.record_id !== "")
  @IsUUID("4", { message: "invalid value" })
  record_id?: string;

  @IsOptional()
  @ValidateIf((dto: CreateTransactionDto) => dto.expense_id !== "")
  @IsUUID("4", { message: "invalid value" })
  expense_id?: string;
}
