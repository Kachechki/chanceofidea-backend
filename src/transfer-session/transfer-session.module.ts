import { Module } from "@nestjs/common";
import { TransferSessionService } from "./services/TransferSession.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransferSessionEntity } from "./entities/TransferSession.entity";
import { TransferSessionController } from "./transfer-session.controller";
import { GithubModule } from "../github/github.module";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { ApplicationModule } from "../application/application.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TransferSessionEntity]),
    GithubModule,
    UserModule,
    AuthModule,
    ApplicationModule,
  ],
  providers: [TransferSessionService],
  controllers: [TransferSessionController],
  exports: [TransferSessionService],
})
export class TransferSessionModule {}
