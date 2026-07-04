import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

import { PaymentType } from "../../../prisma/generated";

export class ListRecordsDto {
  @IsOptional()
  @IsEnum(PaymentType, { message: "invalid value" })
  payment_type?: PaymentType;

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
