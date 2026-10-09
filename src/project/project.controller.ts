import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ProjectService } from "./services/Project.service";
import { CreateProjectDto } from "../dto/CreateProject.dto";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { ProjectGuard } from "./guards/Project.guard";
import { UpdateProjectDto } from "../dto/UpdateProject.dto";
import { GetDeleteProjectDto } from "../dto/GetDeleteProject.dto";

@Controller("project")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() dto: CreateProjectDto, @Req() req: IRequestWithRefresh) {
    await this.projectService.create({
      ...dto,
      ownerId: req.user.id,
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  async get(@Query() dto: GetDeleteProjectDto) {
    return await this.projectService.findById(dto.id);
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Patch()
  async update(@Body() dto: UpdateProjectDto) {
    await this.projectService.update(dto);
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Delete()
  async delete(@Query() dto: GetDeleteProjectDto) {
    await this.projectService.delete(dto.id);
  }
}
