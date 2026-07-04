import { Injectable } from "@nestjs/common";

import { Expense, Prisma } from "../../prisma/generated";
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
    if (dto.amount <= 0) {
      throw new InvalidExpenseException("amount must be positive");
    }

    if (dto.comment && dto.comment.trim().length === 0) {
      throw new InvalidExpenseException("comment cannot be empty");
    }

    return this.prisma.expense.create({
      data: {
        amount: dto.amount,
        comment: normalizeComment(dto.comment),
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
    const expenseId = parseExpenseId(id);
    const data = buildExpenseUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new InvalidExpenseException("at least one field is required");
    }

    try {
      return await this.prisma.expense.update({
        data,
        where: { id: expenseId },
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new ExpenseNotFoundException();
      }

      throw error;
    }
  }

  async delete(id: string): Promise<Expense> {
    const expenseId = parseExpenseId(id);

    try {
      return await this.prisma.expense.delete({
        where: { id: expenseId },
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new ExpenseNotFoundException();
      }

      throw error;
    }
  }
}

function buildExpenseUpdateData(
  dto: UpdateExpenseDto,
): Prisma.ExpenseUpdateInput {
  const data: Prisma.ExpenseUpdateInput = {};

  if (dto.amount !== undefined) {
    if (dto.amount <= 0) {
      throw new InvalidExpenseException("amount must be positive");
    }

    data.amount = dto.amount;
  }

  if (dto.comment !== undefined) {
    data.comment = normalizeComment(dto.comment);
  }

  return data;
}

function normalizeComment(comment?: string): string {
  return comment?.trim() ?? "";
}

function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function parseExpenseId(id: string): string {
  if (!isUuid(id)) {
    throw new InvalidExpenseException("invalid expense id");
  }

  return id;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
