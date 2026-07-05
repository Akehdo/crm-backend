import {
  Body,
  Controller,
  Delete,
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
import {
  Record as RecordModel,
  Transaction,
  TransactionType,
} from "../../prisma/generated";
import { createPaginationMeta } from "../../shared/pagination";
import { toMoneyNumber } from "../../shared/money";
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

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async delete(@Param("id") id: string) {
    const record = await this.records.delete(id);
    return recordResponse(record);
  }
}

type RecordResponseModel = RecordModel & {
  transactions?: Transaction[];
};

function recordResponse(record: RecordResponseModel) {
  return {
    id: record.id,
    client_code: Number(record.clientCode),
    track_numbers: trackNumbersResponse(record.trackNumbers),
    weight: record.weight,
    price: toMoneyNumber(record.price),
    payment_type: record.paymentType,
    payments: paymentsResponse(record),
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

function paymentsResponse(record: RecordResponseModel) {
  const payments = record.transactions
    ?.filter(
      (transaction) => transaction.transactionType === TransactionType.INCOME,
    )
    .map((transaction) => ({
      amount: toMoneyNumber(transaction.amount),
      payment_type: transaction.paymentType,
    }));

  if (payments && payments.length > 0) {
    return payments;
  }

  return [
    {
      amount: toMoneyNumber(record.price),
      payment_type: record.paymentType,
    },
  ];
}
