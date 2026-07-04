import { Injectable } from "@nestjs/common";

import { Prisma } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRecordDto } from "./dto/create-record.dto";
import { InvalidRecordException } from "./exceptions/invalid-record.exception";
import { RecordAlreadyExistsException } from "./exceptions/record-already-exists.exception";
import { PAYMENT_TYPES } from "./records.constants";

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecordDto): Promise<void> {
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
      await this.prisma.record.create({
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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
