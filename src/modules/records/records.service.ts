import { Injectable } from "@nestjs/common";

import {
  PaymentType,
  Prisma,
  Record as RecordModel,
  TransactionType,
} from "../../prisma/generated";
import { createPaginationParams } from "../../shared/pagination";
import { toMoneyNumber } from "../../shared/money";
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
    const where: Prisma.RecordWhereInput = paymentType
      ? {
          OR: [
            { paymentType },
            {
              transactions: {
                some: {
                  paymentType,
                  transactionType: TransactionType.INCOME,
                },
              },
            },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.record.findMany({
        include: {
          transactions: {
            orderBy: { createdAt: "asc" },
            where: { transactionType: TransactionType.INCOME },
          },
        },
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
    // Trim track numbers, drop empty values, and keep only first copies.
    const seenTrackNumbers = new Set<string>();
    const trackNumbers: string[] = [];

    for (const value of dto.track_numbers) {
      const trackNumber = value.trim();
      if (!trackNumber || seenTrackNumbers.has(trackNumber)) {
        continue;
      }

      seenTrackNumbers.add(trackNumber);
      trackNumbers.push(trackNumber);
    }

    if (dto.client_code <= 0) {
      throw new InvalidRecordException("client code is required");
    }

    if (trackNumbers.length === 0) {
      throw new InvalidRecordException("track numbers are required");
    }

    if (dto.price <= 0 || dto.weight <= 0) {
      throw new InvalidRecordException("price and weight must be positive");
    }

    // Build payment rows: old clients can still send one payment_type only.
    const payments: { amount: number; payment_type: PaymentType }[] = [];

    if (!dto.payments || dto.payments.length === 0) {
      if (!dto.payment_type) {
        throw new InvalidRecordException("payments are required");
      }

      payments.push({
        amount: dto.price,
        payment_type: dto.payment_type,
      });
    } else {
      const seenPaymentTypes = new Set<PaymentType>();

      for (const payment of dto.payments) {
        if (payment.amount <= 0) {
          throw new InvalidRecordException("payment amount must be positive");
        }

        if (seenPaymentTypes.has(payment.payment_type)) {
          throw new InvalidRecordException("duplicate payment type");
        }

        seenPaymentTypes.add(payment.payment_type);
      }

      const paymentsTotal = dto.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      if (Math.abs(paymentsTotal - dto.price) >= 0.000001) {
        throw new InvalidRecordException("payments total must equal price");
      }

      payments.push(...dto.payments);
    }

    try {
      return await this.prisma.record.create({
        data: {
          clientCode: BigInt(dto.client_code),
          paymentType: payments[0].payment_type,
          price: dto.price,
          trackNumbers,
          transactions: {
            create: payments.map((payment) => ({
              amount: payment.amount,
              paymentType: payment.payment_type,
              transactionType: TransactionType.INCOME,
            })),
          },
          weight: dto.weight,
        },
        include: {
          transactions: {
            orderBy: { createdAt: "asc" },
            where: { transactionType: TransactionType.INCOME },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new RecordAlreadyExistsException();
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateRecordDto): Promise<RecordModel> {
    // Validate the route id before reading or updating the record.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new InvalidRecordException("invalid record id");
    }

    // If payments are updated without a new price, load the current price.
    const currentRecord =
      dto.payments !== undefined && dto.price === undefined
        ? await this.prisma.record.findUnique({
            select: { price: true },
            where: { id },
          })
        : undefined;

    if (currentRecord === null) {
      throw new RecordNotFoundException();
    }

    // Build the Record update object field by field from the received dto.
    const data: Prisma.RecordUpdateInput = {};

    if (dto.client_code !== undefined) {
      if (dto.client_code <= 0) {
        throw new InvalidRecordException("client code is required");
      }

      data.clientCode = BigInt(dto.client_code);
    }

    if (dto.track_numbers !== undefined) {
      const seenTrackNumbers = new Set<string>();
      const trackNumbers: string[] = [];

      for (const value of dto.track_numbers) {
        const trackNumber = value.trim();
        if (!trackNumber || seenTrackNumbers.has(trackNumber)) {
          continue;
        }

        seenTrackNumbers.add(trackNumber);
        trackNumbers.push(trackNumber);
      }

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

    // Validate split payments against the new price or the current record price.
    const requestedPayments = dto.payments;
    const payments:
      { amount: number; payment_type: PaymentType }[] | undefined =
      requestedPayments !== undefined ? [] : undefined;

    if (requestedPayments !== undefined && payments !== undefined) {
      const priceForPayments =
        dto.price ??
        (currentRecord ? toMoneyNumber(currentRecord.price) : undefined);

      if (priceForPayments === undefined || priceForPayments <= 0) {
        throw new InvalidRecordException("price must be positive");
      }

      if (requestedPayments.length === 0) {
        throw new InvalidRecordException("payments are required");
      }

      const seenPaymentTypes = new Set<PaymentType>();

      for (const payment of requestedPayments) {
        if (payment.amount <= 0) {
          throw new InvalidRecordException("payment amount must be positive");
        }

        if (seenPaymentTypes.has(payment.payment_type)) {
          throw new InvalidRecordException("duplicate payment type");
        }

        seenPaymentTypes.add(payment.payment_type);
      }

      const paymentsTotal = requestedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      if (Math.abs(paymentsTotal - priceForPayments) >= 0.000001) {
        throw new InvalidRecordException("payments total must equal price");
      }

      payments.push(...requestedPayments);
    }

    if (payments !== undefined) {
      data.paymentType = payments[0].payment_type;
    } else if (dto.payment_type !== undefined) {
      data.paymentType = dto.payment_type;
    }

    // Keep linked INCOME transactions aligned with record money fields.
    const transactionData: Prisma.TransactionUpdateManyMutationInput = {};

    if (dto.price !== undefined) {
      transactionData.amount = dto.price;
    }

    if (dto.payment_type !== undefined) {
      transactionData.paymentType = dto.payment_type;
    }

    if (payments !== undefined) {
      data.transactions = {
        create: payments.map((payment) => ({
          amount: payment.amount,
          paymentType: payment.payment_type,
          transactionType: TransactionType.INCOME,
        })),
        deleteMany: {
          transactionType: TransactionType.INCOME,
        },
      };
    } else if (Object.keys(transactionData).length > 0) {
      data.transactions = {
        updateMany: {
          data: transactionData,
          where: {
            transactionType: TransactionType.INCOME,
          },
        },
      };
    }

    if (Object.keys(data).length === 0) {
      throw new InvalidRecordException("at least one field is required");
    }

    try {
      return await this.prisma.record.update({
        data,
        include: {
          transactions: {
            orderBy: { createdAt: "asc" },
            where: { transactionType: TransactionType.INCOME },
          },
        },
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new RecordNotFoundException();
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new RecordAlreadyExistsException();
      }

      throw error;
    }
  }

  async delete(id: string): Promise<RecordModel> {
    // Validate the route id before deleting the record and its transactions.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new InvalidRecordException("invalid record id");
    }

    try {
      // Delete child transactions first, then the record in one transaction.
      const [, record] = await this.prisma.$transaction([
        this.prisma.transaction.deleteMany({
          where: { recordId: id },
        }),
        this.prisma.record.delete({
          where: { id },
        }),
      ]);

      return record;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new RecordNotFoundException();
      }

      throw error;
    }
  }
}
