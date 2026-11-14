import { forwardRef, Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./services/Settings.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettingsEntity } from "./entities/Settings.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SettingsEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
