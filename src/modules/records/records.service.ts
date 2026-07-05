import { Injectable } from "@nestjs/common";

import {
  PaymentType,
  Prisma,
  Record as RecordModel,
  TransactionType,
} from "../../prisma/generated";
import { createPaginationParams } from "../../shared/pagination";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRecordDto } from "./dto/create-record.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { InvalidRecordException } from "./exceptions/invalid-record.exception";
import { RecordAlreadyExistsException } from "./exceptions/record-already-exists.exception";
import { RecordNotFoundException } from "./exceptions/record-not-found.exception";
import { ListRecordsResult } from "./types/records.types";

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    paymentType?: PaymentType,
    page?: number,
    limit?: number,
  ): Promise<ListRecordsResult> {
    const params = createPaginationParams(page, limit);
    const where: Prisma.RecordWhereInput = paymentType ? { paymentType } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.record.findMany({
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
        where,
      }),
      this.prisma.record.count({ where }),
    ]);

    return {
      items,
      limit: params.limit,
      page: params.page,
      total,
    };
  }

  async create(dto: CreateRecordDto): Promise<RecordModel> {
    const trackNumbers = normalizeTrackNumbers(dto.track_numbers);

    if (dto.client_code <= 0) {
      throw new InvalidRecordException("client code is required");
    }

    if (trackNumbers.length === 0) {
      throw new InvalidRecordException("track numbers are required");
    }

    if (dto.price <= 0 || dto.weight <= 0) {
      throw new InvalidRecordException("price and weight must be positive");
    }

    try {
      return await this.prisma.record.create({
        data: {
          clientCode: BigInt(dto.client_code),
          paymentType: dto.payment_type,
          price: dto.price,
          trackNumbers,
          transactions: {
            create: {
              amount: dto.price,
              paymentType: dto.payment_type,
              transactionType: TransactionType.INCOME,
            },
          },
          weight: dto.weight,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new RecordAlreadyExistsException();
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateRecordDto): Promise<RecordModel> {
    const recordId = parseRecordId(id);
    const data = buildRecordUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new InvalidRecordException("at least one field is required");
    }

    try {
      return await this.prisma.record.update({
        data,
        where: { id: recordId },
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new RecordNotFoundException();
      }

      if (isUniqueConstraintError(error)) {
        throw new RecordAlreadyExistsException();
      }

      throw error;
    }
  }

  async delete(id: string): Promise<RecordModel> {
    const recordId = parseRecordId(id);

    try {
      return await this.prisma.record.delete({
        where: { id: recordId },
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new RecordNotFoundException();
      }

      throw error;
    }
  }
}

function normalizeTrackNumbers(trackNumbers: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of trackNumbers) {
    const trackNumber = value.trim();
    if (!trackNumber || seen.has(trackNumber)) {
      continue;
    }

    seen.add(trackNumber);
    result.push(trackNumber);
  }

  return result;
}

function buildRecordUpdateData(dto: UpdateRecordDto): Prisma.RecordUpdateInput {
  const data: Prisma.RecordUpdateInput = {};

  if (dto.client_code !== undefined) {
    if (dto.client_code <= 0) {
      throw new InvalidRecordException("client code is required");
    }

    data.clientCode = BigInt(dto.client_code);
  }

  if (dto.track_numbers !== undefined) {
    const trackNumbers = normalizeTrackNumbers(dto.track_numbers);
    if (trackNumbers.length === 0) {
      throw new InvalidRecordException("track numbers are required");
    }

    data.trackNumbers = trackNumbers;
  }

  if (dto.weight !== undefined) {
    if (dto.weight <= 0) {
      throw new InvalidRecordException("weight must be positive");
    }

    data.weight = dto.weight;
  }

  if (dto.price !== undefined) {
    if (dto.price <= 0) {
      throw new InvalidRecordException("price must be positive");
    }

    data.price = dto.price;
  }

  if (dto.payment_type !== undefined) {
    data.paymentType = dto.payment_type;
  }

  const transactionData: Prisma.TransactionUpdateManyMutationInput = {};

  if (dto.price !== undefined) {
    transactionData.amount = dto.price;
  }

  if (dto.payment_type !== undefined) {
    transactionData.paymentType = dto.payment_type;
  }

  if (Object.keys(transactionData).length > 0) {
    data.transactions = {
      updateMany: {
        data: transactionData,
        where: {
          transactionType: TransactionType.INCOME,
        },
      },
    };
  }

  return data;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function parseRecordId(id: string): string {
  if (!isUuid(id)) {
    throw new InvalidRecordException("invalid record id");
  }

  return id;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
