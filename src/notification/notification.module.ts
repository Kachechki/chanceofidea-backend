import { forwardRef, Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotifiactionService } from "./services/Notification.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationEntity } from "./entites/Notification.entity";
import { TransferSessionModule } from "../transfer-session/transfer-session.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    forwardRef(() => TransferSessionModule),
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [NotifiactionService],
  exports: [NotifiactionService],
})
export class NotificationModule {}
