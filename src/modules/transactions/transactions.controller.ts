import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";

import { Transaction } from "../../prisma/generated";
import { createPaginationMeta } from "../../shared/pagination";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import { ListTransactionsDto } from "./dto/list-transactions.dto";
import { TransactionsService } from "./transactions.service";

@Controller("transactions")
@UseGuards(AccessTokenGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  async list(@Query() dto: ListTransactionsDto) {
    const result = await this.transactions.list(dto);

    return {
      items: result.items.map(transactionResponse),
      meta: createPaginationMeta(result.page, result.limit, result.total),
    };
  }
}

function transactionResponse(transaction: Transaction) {
  return {
    amount: transaction.amount,
    created_at: transaction.createdAt,
    expense_id: transaction.expenseId,
    id: transaction.id,
    payment_type: transaction.paymentType,
    record_id: transaction.recordId,
    transaction_type: transaction.transactionType,
    updated_at: transaction.updatedAt,
  };
}
