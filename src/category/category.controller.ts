import { Controller, Get, UseGuards } from "@nestjs/common";
import { CategoryService } from "./services/Category.sevice";
import { AuthGuard } from "../auth/guards/Auth.guard";

@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AuthGuard)
  @Get() 
  async fetchAll() {
    return await this.categoryService.findAll();
  }
}
