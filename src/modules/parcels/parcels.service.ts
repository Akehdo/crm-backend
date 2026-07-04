import { Injectable } from "@nestjs/common";

import { Parcel } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { InvalidParcelRequestException } from "./exceptions/invalid-parcel-request.exception";
import { ParcelNotFoundException } from "./exceptions/parcel-not-found.exception";
import { ParcelStatus, ParcelStatusEnum } from "./parcels.constants";
import { createPaginationParams } from "./parcels.pagination";
import { CreateParcelsResult, ListParcelsResult } from "./types/parcel-types";

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(trackNumbers: string[]): Promise<CreateParcelsResult> {
    const normalized = normalizeTrackNumbers(trackNumbers);
    if (normalized.length === 0) {
      throw new InvalidParcelRequestException("track numbers are required");
    }

    return this.prisma.parcel.createMany({
      data: normalized.map((trackNumber) => ({
        status: ParcelStatusEnum.added,
        trackNumber,
      })),
      skipDuplicates: true,
    });
  }

  async getByTrackNumber(trackNumber: string): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackNumber: trackNumber.trim() },
    });

    if (!parcel) {
      throw new ParcelNotFoundException();
    }

    return parcel;
  }

  async list(
    status?: ParcelStatus,
    page?: number,
    limit?: number,
  ): Promise<ListParcelsResult> {
    const params = createPaginationParams(page, limit);
    const where = status ? { status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.parcel.findMany({
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
        where,
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return {
      items,
      limit: params.limit,
      page: params.page,
      total,
    };
  }

  async upsertStatus(
    trackNumbers: string[],
    status: ParcelStatus,
  ): Promise<Parcel[]> {
    const normalized = normalizeTrackNumbers(trackNumbers);
    if (normalized.length === 0) {
      throw new InvalidParcelRequestException("track numbers are required");
    }

    return this.prisma.$transaction(
      normalized.map((trackNumber) =>
        this.prisma.parcel.upsert({
          create: {
            status,
            trackNumber,
          },
          update: { status },
          where: { trackNumber },
        }),
      ),
    );
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
