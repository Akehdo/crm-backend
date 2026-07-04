import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import { PaymentType } from "../../../prisma/generated";

export class UpdateRecordDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "invalid value" })
  @Min(1, { message: "invalid value" })
  client_code?: number;

  @IsOptional()
  @IsArray({ message: "invalid value" })
  @ArrayMinSize(1, { message: "invalid value" })
  @IsString({ each: true, message: "invalid value" })
  @IsNotEmpty({ each: true, message: "field is required" })
  track_numbers?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "invalid value" })
  @Min(0.0000001, { message: "invalid value" })
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "invalid value" })
  @Min(0.0000001, { message: "invalid value" })
  price?: number;

  @IsOptional()
  @IsEnum(PaymentType, { message: "invalid value" })
  payment_type?: PaymentType;
}
