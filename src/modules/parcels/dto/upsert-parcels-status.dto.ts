import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
} from "class-validator";

import { PARCEL_STATUSES, ParcelStatus } from "../parcels.constants";

export class UpsertParcelsStatusDto {
  @IsArray({ message: "invalid value" })
  @ArrayMinSize(1, { message: "field is required" })
  @IsString({ each: true, message: "invalid value" })
  @IsNotEmpty({ each: true, message: "field is required" })
  track_numbers!: string[];

  @IsIn(PARCEL_STATUSES, { message: "invalid value" })
  status!: ParcelStatus;
}
