import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { Record as RecordModel } from "../../prisma/generated";
import { CreateRecordDto } from "./dto/create-record.dto";
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
