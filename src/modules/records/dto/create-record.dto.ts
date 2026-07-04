import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from "class-validator";

import { PaymentType } from "../../../prisma/generated";

export class CreateRecordDto {
  @Type(() => Number)
  @IsInt({ message: "invalid value" })
  @Min(1, { message: "field is required" })
  client_code!: number;

  @IsArray({ message: "invalid value" })
  @ArrayMinSize(1, { message: "field is required" })
  @IsString({ each: true, message: "invalid value" })
  @IsNotEmpty({ each: true, message: "field is required" })
  track_numbers!: string[];

  @Type(() => Number)
  @IsNumber({}, { message: "invalid value" })
  @Min(0.0000001, { message: "invalid value" })
  weight!: number;

  @Type(() => Number)
  @IsNumber({}, { message: "invalid value" })
  @Min(0.0000001, { message: "invalid value" })
  price!: number;

  @IsEnum(PaymentType, { message: "invalid value" })
  payment_type!: PaymentType;
}
