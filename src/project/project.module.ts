import { Module } from "@nestjs/common";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./services/Project.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectEntity } from "./entities/Project.entity";
import { CategoryModule } from "../category/category.module";
import { TagModule } from "../tag/tag.module";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { TransferSessionModule } from "../transfer-session/transfer-session.module";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity]),
    CategoryModule,
    TagModule,
    AuthModule,
    UserModule,
    TransferSessionModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
