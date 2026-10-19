import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ProjectIdDto } from "../dto/GetDeleteProject.dto";
import { SearchProjectsDto, SearchProjectsPageDto } from "../dto/SearchProjects.dto";

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
  async get(@Query() dto: ProjectIdDto) {
    return await this.projectService.findById(dto.id, {
      applications: true,
      category: true,
      owner: true,
      tags: true,
    });
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Patch()
  async update(@Body() dto: UpdateProjectDto) {
    await this.projectService.update(dto);
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Delete()
  async delete(@Query() dto: ProjectIdDto) {
    await this.projectService.delete(dto.id);
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Post("publish")
  async publish(@Query() dto: ProjectIdDto) {
    await this.projectService.publish(dto.id);
  }

  @UseGuards(AuthGuard)
  @Get("projects/:page")
  async search(
    @Query() dto: SearchProjectsDto,
    @Param() pageDto: SearchProjectsPageDto,
  ) {
    return await this.projectService.search({
      ...dto,
      ...pageDto,
    });
  }
}
