import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationEntity } from "./entities/Application.entity";
import { ApplicationController } from "./application.controller";
import { AuthModule } from "../auth/auth.module";
import { ProjectModule } from "../project/project.module";
import { UserModule } from "../user/user.module";
import { ApplicationService } from "./services/Application.service";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity]),
    AuthModule,
    forwardRef(() => ProjectModule),
    UserModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
