import { Controller, Get, UseGuards } from "@nestjs/common";
import { TagService } from "./services/Tag.service";
import { AuthGuard } from "../auth/guards/Auth.guard";

@Controller("tag")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @UseGuards(AuthGuard)
  @Get()
  async fetchAll() {
    return await this.tagService.findAll();
  }
}
