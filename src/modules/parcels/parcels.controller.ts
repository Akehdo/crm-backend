import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { Parcel } from "../../prisma/generated";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { CreateParcelsDto } from "./dto/create-parcels.dto";
import { ListParcelsDto } from "./dto/list-parcels.dto";
import { UpsertParcelsStatusDto } from "./dto/upsert-parcels-status.dto";
import { createPaginationMeta } from "./parcels.pagination";
import { ParcelsService } from "./parcels.service";

@Controller("parcels")
@UseGuards(AccessTokenGuard)
export class ParcelsController {
  constructor(private readonly parcels: ParcelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateParcelsDto) {
    await this.parcels.create(dto.track_numbers);
    return { message: "parcels created successfully" };
  }

  @Get(":track_number")
  async getByTrackNumber(@Param("track_number") trackNumber: string) {
    return parcelResponse(await this.parcels.getByTrackNumber(trackNumber));
  }

  @Get()
  async list(@Query() dto: ListParcelsDto) {
    const result = await this.parcels.list(dto.status, dto.page, dto.limit);

    return {
      items: result.items.map(parcelResponse),
      meta: createPaginationMeta(result.page, result.limit, result.total),
    };
  }

  @Put("status")
  @HttpCode(HttpStatus.OK)
  async upsertStatus(@Body() dto: UpsertParcelsStatusDto) {
    await this.parcels.upsertStatus(dto.track_numbers, dto.status);
    return { message: "parcels status updated successfully" };
  }
}

function parcelResponse(parcel: Parcel) {
  return {
    created_at: parcel.createdAt,
    id: parcel.id,
    status: parcel.status,
    track_number: parcel.trackNumber,
    updated_at: parcel.updatedAt,
  };
}
