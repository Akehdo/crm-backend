import { Injectable } from "@nestjs/common";

import { Parcel, ParcelStatus } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { InvalidParcelRequestException } from "./exceptions/invalid-parcel-request.exception";
import { ParcelNotFoundException } from "./exceptions/parcel-not-found.exception";
import { CreateParcelsResult, ListParcelsResult } from "./types/parcel-types";
import { createPaginationParams } from "../../shared/pagination";

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(trackNumbers: string[]): Promise<CreateParcelsResult> {
    // Trim incoming track numbers, drop empty values, and keep only first copies.
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const value of trackNumbers) {
      const trackNumber = value.trim();
      if (!trackNumber || seen.has(trackNumber)) {
        continue;
      }

      seen.add(trackNumber);
      normalized.push(trackNumber);
    }

    if (normalized.length === 0) {
      throw new InvalidParcelRequestException("track numbers are required");
    }

    return this.prisma.parcel.createMany({
      data: normalized.map((trackNumber) => ({
        status: ParcelStatus.added,
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
    // Trim incoming track numbers, drop empty values, and keep only first copies.
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const value of trackNumbers) {
      const trackNumber = value.trim();
      if (!trackNumber || seen.has(trackNumber)) {
        continue;
      }

      seen.add(trackNumber);
      normalized.push(trackNumber);
    }

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
