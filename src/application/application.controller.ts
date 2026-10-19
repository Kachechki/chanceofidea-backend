import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApplicationService } from "./services/Application.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { CreateApplicationDto } from "../dto/CreateApplication.dto";
import { ProjectGuard } from "../project/guards/Project.guard";
import { AcceptRejectApplicationDto } from "../dto/AcceptRejectApplication.dto";
import { RejectApplicationDto } from "../dto/RejectApplication.dto";

@Controller("application")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Req() req: IRequestWithRefresh, @Body() dto: CreateApplicationDto) {
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
  async accept(@Query() dto: AcceptRejectApplicationDto) {
    await this.applicationService.accept(dto.applicationId);
  }

  @Post("reject")
  @UseGuards(AuthGuard, ProjectGuard)
  async reject(
    @Query() queryDto: AcceptRejectApplicationDto,
    @Body() dto: RejectApplicationDto,
  ) {
    await this.applicationService.reject(
      queryDto.applicationId,
      dto.rejectReason,
    );
  }

  @Get("incoming")
  @UseGuards(AuthGuard)
  async getIncoming(@Req() req: IRequestWithRefresh) {
    return await this.applicationService.findIncoming(req.user.id);
  }

  @Get("outcoming")
  @UseGuards(AuthGuard)
  async getOutcoming(@Req() req: IRequestWithRefresh) {
    return await this.applicationService.findOutcoming(req.user.id);
  }
}
