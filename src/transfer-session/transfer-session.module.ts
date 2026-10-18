import { Module } from "@nestjs/common";
import { TransferSessionService } from "./services/TransferSession.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransferSessionEntity } from "./entities/TransferSession.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TransferSessionEntity])],
  providers: [TransferSessionService],
  exports: [TransferSessionService],
})
export class TransferSessionModule {}
