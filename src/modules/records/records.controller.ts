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
    await this.records.create(dto);
    return { message: "record created successfully" };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async update(@Param("id") id: string, @Body() dto: UpdateRecordDto) {
    await this.records.update(id, dto);
    return { message: "record updated successfully" };
  }
}
