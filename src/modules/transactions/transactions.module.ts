import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [TransactionsController],
  exports: [TransactionsService],
  imports: [AuthModule],
  providers: [TransactionsService],
})
export class TransactionsModule {}
