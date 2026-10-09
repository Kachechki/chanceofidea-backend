import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { TagService } from "./services/Tag.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { CreateCategoryOrTagDto } from "../dto/CreateCategoryOrTag.dto";

@Controller("tag")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() dto: CreateCategoryOrTagDto) {
    await this.tagService.create(dto);
  }
}
