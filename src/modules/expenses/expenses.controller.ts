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

import { Expense } from "../../prisma/generated";
import { createPaginationMeta } from "../../shared/pagination";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ListExpensesDto } from "./dto/list-expenses.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
@UseGuards(AccessTokenGuard)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateExpenseDto) {
    const expense = await this.expenses.create(dto);
    return expenseResponse(expense);
  }

  @Get()
  async list(@Query() dto: ListExpensesDto) {
    const result = await this.expenses.list(dto.page, dto.limit);

    return {
      items: result.items.map(expenseResponse),
      meta: createPaginationMeta(result.page, result.limit, result.total),
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async update(@Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    const expense = await this.expenses.update(id, dto);
    return expenseResponse(expense);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async delete(@Param("id") id: string) {
    const expense = await this.expenses.delete(id);
    return expenseResponse(expense);
  }
}

function expenseResponse(expense: Expense) {
  return {
    amount: expense.amount,
    comment: expense.comment,
    created_at: expense.createdAt,
    id: expense.id,
    payment_type: expense.paymentType,
    updated_at: expense.updatedAt,
  };
}
