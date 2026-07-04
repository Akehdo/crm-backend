import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { PARCEL_STATUSES, ParcelStatus } from "../parcels.constants";

export class ListParcelsDto {
  @IsOptional()
  @IsIn(PARCEL_STATUSES, { message: "invalid value" })
  status?: ParcelStatus;

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
