import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { Record as RecordModel } from "../../prisma/generated";
import { createPaginationMeta } from "../../shared/pagination";
import { CreateRecordDto } from "./dto/create-record.dto";
import { ListRecordsDto } from "./dto/list-records.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { RecordsService } from "./records.service";

@Controller("records")
@UseGuards(AccessTokenGuard)
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRecordDto) {
    const record = await this.records.create(dto);
    return recordResponse(record);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async update(@Param("id") id: string, @Body() dto: UpdateRecordDto) {
    const record = await this.records.update(id, dto);
    return recordResponse(record);
  }

  @Get()
  async list(@Query() dto: ListRecordsDto) {
    const result = await this.records.list(
      dto.payment_type,
      dto.page,
      dto.limit,
    );

    return {
      items: result.items.map(recordResponse),
      meta: createPaginationMeta(result.page, result.limit, result.total),
    };
  }
}

function recordResponse(record: RecordModel) {
  return {
    id: record.id,
    client_code: Number(record.clientCode),
    track_numbers: trackNumbersResponse(record.trackNumbers),
    weight: record.weight,
    price: record.price,
    payment_type: record.paymentType,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function trackNumbersResponse(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
