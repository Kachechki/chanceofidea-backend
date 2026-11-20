import { Module } from "@nestjs/common";
import { ReportController } from "./report.controller";
import { ReportService } from "./services/Report.service";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportEntity } from "./entities/Report.entity";
import { ProjectModule } from "../project/project.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity]),
    AuthModule,
    ProjectModule,
    UserModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
