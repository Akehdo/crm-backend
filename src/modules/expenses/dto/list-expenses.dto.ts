import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class ListExpensesDto {
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
