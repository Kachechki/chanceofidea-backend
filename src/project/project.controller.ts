import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ProjectService } from "./services/Project.service";
import { CreateProjectDto } from "../dto/CreateProject.dto";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { ProjectGuard } from "./guards/Project.guard";
import { UpdateProjectDto } from "../dto/UpdateProject.dto";
import { ProjectIdDto } from "../dto/GetDeleteProject.dto";
import { SearchProjectsDto } from "../dto/SearchProjects.dto";
import { ProjectDto } from "../dto/ProjectDto";

@ApiTags("Projects")
@ApiBearerAuth()
@Controller("project")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: "Create a project" })
  @ApiCreatedResponse({
    description: "Project created successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiBadRequestResponse({
    description: "Invalid project data",
  })
  async create(
    @Body() dto: CreateProjectDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.projectService.create({
      ...dto,
      ownerId: req.user.id,
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "Get a project by ID" })
  @ApiOkResponse({
    description: "Project retrieved successfully",
    type: ProjectDto,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "Project not found",
  })
  async get(@Query() dto: ProjectIdDto): Promise<ProjectDto> {
    const project = await this.projectService.findById(dto.id, {
      applications: true,
      category: true,
      owner: true,
      tags: true,
    });

    return {
      id: project.id,
      title: project.title,
      category: project.category,
      createdAt: project.createdAt,
      description: project.description,
      owner: {
        id: project.owner.id,
        avatarUrl: project.owner.avatarUrl,
        bio: project.owner.bio,
        createdAt: project.owner.createdAt,
        login: project.owner.login,
      },
      repositoryName: project.repositoryName,
      status: project.status,
      tags: project.tags,
    };
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Patch()
  @ApiOperation({ summary: "Update a project" })
  @ApiOkResponse({
    description: "Project updated successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "Project not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid project data",
  })
  async update(@Body() dto: UpdateProjectDto): Promise<void> {
    await this.projectService.update(dto);
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a project" })
  @ApiNoContentResponse({
    description: "Project deleted successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "Project not found",
  })
  async delete(@Query() dto: ProjectIdDto): Promise<void> {
    await this.projectService.delete(dto.id);
  }

  @UseGuards(AuthGuard, ProjectGuard)
  @Post("publish")
  @ApiOperation({ summary: "Publish a project" })
  @ApiOkResponse({
    description: "Project published successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "Project not found",
  })
  @ApiBadRequestResponse({
    description: "Project cannot be published",
  })
  async publish(@Query() dto: ProjectIdDto): Promise<void> {
    await this.projectService.publish(dto.id);
  }

  @Get("projects")
  @ApiOperation({ summary: "Search projects with pagination and filters" })
  @ApiOkResponse({
    description: "Projects matching the search criteria",
    type: ProjectDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiBadRequestResponse({
    description: "Invalid search parameters",
  })
  async search(@Query() dto: SearchProjectsDto) {
    return this.projectService.search(dto);
  }
}
