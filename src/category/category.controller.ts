import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CategoryService } from "./services/Category.sevice";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { CreateCategoryOrTagDto } from "../dto/CreateCategoryOrTag.dto";

@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() dto: CreateCategoryOrTagDto) {
    await this.categoryService.create(dto);
  }
}
