import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { CreateRecordDto } from "./dto/create-record.dto";
import { RecordsService } from "./records.service";

@Controller("records")
@UseGuards(AccessTokenGuard)
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRecordDto) {
    await this.records.create(dto);
    return { message: "record created successfully" };
  }
}
