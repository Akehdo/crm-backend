import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ParcelsController } from "./parcels.controller";
import { ParcelsService } from "./parcels.service";

@Module({
  controllers: [ParcelsController],
  imports: [AuthModule],
  providers: [ParcelsService],
})
export class ParcelsModule {}
