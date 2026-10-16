import { Module } from "@nestjs/common";
import { CategoriesSeederService } from "./services/CategoriesSeeder.service";
import { CategoryModule } from "../category/category.module";

@Module({
  imports: [CategoryModule],
  providers: [CategoriesSeederService],
})
export class CategoriesSeederModule {}
