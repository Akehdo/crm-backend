import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from "class-validator";

import { ParcelStatus } from "../../../prisma/generated";

export class UpsertParcelsStatusDto {
  @IsArray({ message: "invalid value" })
  @ArrayMinSize(1, { message: "field is required" })
  @IsString({ each: true, message: "invalid value" })
  @IsNotEmpty({ each: true, message: "field is required" })
  track_numbers!: string[];

  @IsEnum(ParcelStatus, { message: "invalid value" })
  status!: ParcelStatus;
}
