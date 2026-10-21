import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { TagService } from "./services/Tag.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { TagDto } from "../dto/Tag.dto";

@ApiTags("Tags")
@ApiBearerAuth()
@Controller("tag")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "Fetch all tags" })
  @ApiOkResponse({
    description: "Tags retrieved successfully",
    type: TagDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async fetchAll(): Promise<TagDto[]> {
    return this.tagService.findAll();
  }
}
