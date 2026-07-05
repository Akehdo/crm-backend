import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { configuration } from "./config/configuration";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { ParcelsModule } from "./modules/parcels/parcels.module";
import { RecordsModule } from "./modules/records/records.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ParcelsModule,
    RecordsModule,
    ExpensesModule,
    TransactionsModule,
  ],
})
export class AppModule {}
