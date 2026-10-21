import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CategoryService } from "./services/Category.sevice";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { CategoryDto } from "../dto/Category.dto";

@ApiTags("Categories")
@ApiBearerAuth()
@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "Fetch all categories" })
  @ApiOkResponse({
    description: "Categories retrieved successfully",
    type: CategoryDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async fetchAll(): Promise<CategoryDto[]> {
    return this.categoryService.findAll();
  }
}