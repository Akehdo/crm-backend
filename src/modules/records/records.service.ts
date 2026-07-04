import { Injectable } from "@nestjs/common";

import { Prisma, Record as RecordModel } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRecordDto } from "./dto/create-record.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { InvalidRecordException } from "./exceptions/invalid-record.exception";
import { RecordAlreadyExistsException } from "./exceptions/record-already-exists.exception";
import { RecordNotFoundException } from "./exceptions/record-not-found.exception";
import { PAYMENT_TYPES } from "./records.constants";

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<RecordModel[]> {
    return this.prisma.record.findMany();
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

    if (!PAYMENT_TYPES.includes(dto.payment_type)) {
      throw new InvalidRecordException("invalid payment type");
    }

    try {
      return await this.prisma.record.create({
        data: {
          clientCode: BigInt(dto.client_code),
          paymentType: dto.payment_type,
          price: dto.price,
          trackNumbers,
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
    if (!PAYMENT_TYPES.includes(dto.payment_type)) {
      throw new InvalidRecordException("invalid payment type");
    }

    data.paymentType = dto.payment_type;
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
