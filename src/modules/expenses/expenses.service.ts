import { Injectable } from "@nestjs/common";

import {
  Expense,
  PaymentType,
  Prisma,
  TransactionType,
} from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { createPaginationParams } from "../../shared/pagination";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpenseNotFoundException } from "./exceptions/expense-not-found.exception";
import { InvalidExpenseException } from "./exceptions/invalid-expense.exception";
import { ListExpensesResult } from "./types/expenses.types";

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpenseDto): Promise<Expense> {
    // Validate the request before any database work.
    if (dto.amount <= 0) {
      throw new InvalidExpenseException("amount must be positive");
    }

    if (dto.comment && dto.comment.trim().length === 0) {
      throw new InvalidExpenseException("comment cannot be empty");
    }

    // Normalize optional fields in the same place where create data is built.
    const comment = dto.comment?.trim() ?? "";
    const paymentType = dto.payment_type ?? PaymentType.cash;

    return this.prisma.expense.create({
      data: {
        amount: dto.amount,
        comment,
        paymentType,
        transactions: {
          create: {
            amount: dto.amount,
            paymentType,
            transactionType: TransactionType.EXPENSE,
          },
        },
      },
    });
  }

  async list(page?: number, limit?: number): Promise<ListExpensesResult> {
    const params = createPaginationParams(page, limit);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
      }),
      this.prisma.expense.count(),
    ]);

    return {
      items,
      limit: params.limit,
      page: params.page,
      total,
    };
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    // Validate the route id before building the update payload.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new InvalidExpenseException("invalid expense id");
    }

    // Build the Expense update object field by field from the received dto.
    const data: Prisma.ExpenseUpdateInput = {};

    if (dto.amount !== undefined) {
      if (dto.amount <= 0) {
        throw new InvalidExpenseException("amount must be positive");
      }

      data.amount = dto.amount;
    }

    if (dto.payment_type !== undefined) {
      data.paymentType = dto.payment_type;
    }

    if (dto.comment !== undefined) {
      data.comment = dto.comment.trim();
    }

    // Keep linked EXPENSE transactions in sync when money fields change.
    const transactionData: Prisma.TransactionUpdateManyMutationInput = {};

    if (dto.amount !== undefined) {
      transactionData.amount = dto.amount;
    }

    if (dto.payment_type !== undefined) {
      transactionData.paymentType = dto.payment_type;
    }

    if (Object.keys(transactionData).length > 0) {
      data.transactions = {
        updateMany: {
          data: transactionData,
          where: {
            transactionType: TransactionType.EXPENSE,
          },
        },
      };
    }

    if (Object.keys(data).length === 0) {
      throw new InvalidExpenseException("at least one field is required");
    }

    try {
      return await this.prisma.expense.update({
        data,
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new ExpenseNotFoundException();
      }

      throw error;
    }
  }

  async delete(id: string): Promise<Expense> {
    // Validate the route id before deleting the expense and its transactions.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new InvalidExpenseException("invalid expense id");
    }

    try {
      // Delete child transactions first, then the expense in one transaction.
      const [, expense] = await this.prisma.$transaction([
        this.prisma.transaction.deleteMany({
          where: { expenseId: id },
        }),
        this.prisma.expense.delete({
          where: { id },
        }),
      ]);

      return expense;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new ExpenseNotFoundException();
      }

      throw error;
    }
  }
}
