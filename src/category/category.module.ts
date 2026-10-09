import { Module } from "@nestjs/common";
import { CategoryService } from "./services/Category.sevice";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryEntity } from "./entities/Category.entity";
import { CategoryController } from './category.controller';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity]), AuthModule],
  providers: [CategoryService],
  exports: [CategoryService],
  controllers: [CategoryController],
})
export class CategoryModule {}
