import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ReportService } from "./services/Report.service";
import { CreateReportDto } from "../dto/CreateReport.dto";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { GithubVerifiedGuard } from "../auth/guards/GithubVerified.guard";
import { ReportDto } from "../dto/Report.dto";
import { ReportEntity } from "./entities/Report.entity";
import { IdDto } from "../dto/Id.dto";
import { AdminGuard } from "./guards/Admin.guard";
import { UpdateReportDto } from "../dto/UpdateReport.dto";

@Controller("report")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard, GithubVerifiedGuard)
  @Post("create")
  async create(
    @Body() dto: CreateReportDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.reportService.create({
      title: dto.title,
      body: dto.body,
      projectId: dto.projectId,
      writtenBy: req.user.id,
    });
  }

  @Get("reports/me/:page")
  async fetchMyReports(
    @Req() req: IRequestWithRefresh,
    @Param("page") page: number,
  ): Promise<ReportDto[]> {
    const reports = await this.reportService.findByUser(
      req.user.id,
      undefined,
      page,
    );

    return reports.map((report: ReportEntity): ReportDto => ({
      id: report.id,
      title: report.title,
      body: report.body,
      approved: report.approved ?? undefined,
    }));
  }

  @UseGuards(AuthGuard)
  @Get()
  async get(@Query() dto: IdDto): Promise<ReportDto> {
    const report = await this.reportService.findById(dto.id, { project: true });

    return {
      id: report.id,
      title: report.title,
      body: report.body,
      approved: report.approved ?? undefined,
      project: report.project,
    };
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post("approve")
  async approve(@Query() dto: IdDto): Promise<void> {
    await this.reportService.approve(dto.id);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post("reject")
  async reject(@Query() dto: IdDto): Promise<void> {
    await this.reportService.reject(dto.id);
  }

  @UseGuards(AuthGuard)
  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Body() dto: UpdateReportDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.reportService.update({
      id: dto.id,
      userId: req.user.id,
      title: dto.title ?? undefined,
      body: dto.body ?? undefined,
    });
  }

  @UseGuards(AuthGuard)
  @Delete()
  async delete(
    @Query() idDto: IdDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.reportService.delete(idDto.id, req.user.id);
  }
}
