import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";

import { ApplicationService } from "./services/Application.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { CreateApplicationDto } from "../dto/CreateApplication.dto";
import { ProjectGuard } from "../project/guards/Project.guard";
import { AcceptRejectApplicationDto } from "../dto/AcceptRejectApplication.dto";
import { RejectApplicationDto } from "../dto/RejectApplication.dto";
import { ApplicationDto } from "../dto/Application.dto";

@ApiTags("Applications")
@ApiBearerAuth()
@Controller("application")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Create an application for a project" })
  @ApiCreatedResponse({
    description: "Application created successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "User or project not found",
  })
  @ApiBadRequestResponse({
    description: "More than 3 applications per project are not allowed",
  })
  @ApiConflictResponse({
    description: "You already have an active application for this project",
  })
  async create(
    @Req() req: IRequestWithRefresh,
    @Body() dto: CreateApplicationDto,
  ): Promise<void> {
    await this.applicationService.create(
      {
        projectId: dto.projectId,
        whyMe: dto.whyMe,
        plan: dto.plan,
        portfolioUrl: dto.porfolioUrl,
      },
      req.user.id,
    );
  }

  @Post("accept")
  @UseGuards(AuthGuard, ProjectGuard)
  @ApiOperation({ summary: "Accept a project application" })
  @ApiOkResponse({
    description: "Application accepted successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "Application not found",
  })
  @ApiBadRequestResponse({
    description: "Project is already being transferred",
  })
  @ApiConflictResponse({
    description: "One of the applications is already accepted",
  })
  async accept(
    @Query() dto: AcceptRejectApplicationDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.applicationService.accept(dto.applicationId, req.user.id);
  }

  @Post("reject")
  @UseGuards(AuthGuard, ProjectGuard)
  @ApiOperation({ summary: "Reject a project application" })
  @ApiOkResponse({
    description: "Application rejected successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "Application not found",
  })
  async reject(
    @Query() queryDto: AcceptRejectApplicationDto,
    @Body() dto: RejectApplicationDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.applicationService.reject(
      queryDto.applicationId,
      req.user.id,
      dto.rejectReason,
    );
  }

  @Get("incoming")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Get applications received for the user's projects",
  })
  @ApiOkResponse({
    description: "Incoming applications retrieved successfully",
    type: ApplicationDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async getIncoming(
    @Req() req: IRequestWithRefresh,
  ): Promise<ApplicationDto[]> {
    const applicationEntities = await this.applicationService.findIncoming(
      req.user.id,
    );

    return applicationEntities.map((entity): ApplicationDto => ({
      id: entity.id,
      applicant: {
        id: entity.applicant.id,
        bio: entity.applicant.bio,
        avatarUrl: entity.applicant.avatarUrl,
        createdAt: entity.applicant.createdAt,
        login: entity.applicant.login,
      },
      createdAt: entity.createdAt,
      status: entity.status,
      updatedAt: entity.updatedAt,
      whyMe: entity.whyMe,
      plan: entity.plan,
      portfolioUrl: entity.portflioUrl,
      rejectReason: entity.rejectReason,
      project: {
        id: entity.project.id,
        createdAt: entity.project.createdAt,
        description: entity.project.description,
        repositoryName: entity.project.repositoryName,
        status: entity.project.status,
        title: entity.project.title,
      },
    }));
  }

  @Get("outcoming")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Get applications submitted by the authenticated user",
  })
  @ApiOkResponse({
    description: "Outgoing applications retrieved successfully",
    type: ApplicationDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async getOutcoming(
    @Req() req: IRequestWithRefresh,
  ): Promise<ApplicationDto[]> {
    const applicationEntities = await this.applicationService.findOutcoming(
      req.user.id,
    );

    return applicationEntities.map((entity): ApplicationDto => ({
      id: entity.id,
      applicant: {
        id: entity.applicant.id,
        bio: entity.applicant.bio,
        avatarUrl: entity.applicant.avatarUrl,
        createdAt: entity.applicant.createdAt,
        login: entity.applicant.login,
      },
      createdAt: entity.createdAt,
      status: entity.status,
      updatedAt: entity.updatedAt,
      whyMe: entity.whyMe,
      plan: entity.plan,
      portfolioUrl: entity.portflioUrl,
      rejectReason: entity.rejectReason,
      project: entity.project,
    }));
  }
}
