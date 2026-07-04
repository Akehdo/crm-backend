import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateParcelsDto {
  @IsArray({ message: "invalid value" })
  @ArrayMinSize(1, { message: "field is required" })
  @IsString({ each: true, message: "invalid value" })
  @IsNotEmpty({ each: true, message: "field is required" })
  track_numbers!: string[];
}
