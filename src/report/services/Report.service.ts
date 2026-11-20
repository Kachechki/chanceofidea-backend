import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReportEntity } from "../entities/Report.entity";
import { FindOptionsRelations, Repository } from "typeorm";
import { ICreateReport } from "../../types/CreateReport.interface";
import { ProjectService } from "../../project/services/Project.service";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";
import { UserService } from "../../user/services/User.service";
import { IUpdateReport } from "../../types/UpdateReport.interface";

interface IReportService {
  create(data: ICreateReport): Promise<void>;
  approve(id: string): Promise<void>;
  reject(id: string): Promise<void>;
  findByUser(
    userId: string,
    relations?: FindOptionsRelations<ReportEntity>,
    page?: number,
  ): Promise<ReportEntity[]>;
  findById(
    id: string,
    relations?: FindOptionsRelations<ReportEntity>,
  ): Promise<ReportEntity>;
  update(data: IUpdateReport): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}

@Injectable()
export class ReportService implements IReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly repository: Repository<ReportEntity>,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  async create(data: ICreateReport): Promise<void> {
    if (data.title.length > 30)
      throw new BadRequestException("Title length exceeds 30 character limit");

    if (data.body.length > 130)
      throw new BadRequestException("Body length exceeds 130 character limit");

    await this.repository.save({
      title: data.title,
      body: data.body,
      writtenBy: { id: data.writtenBy },
    });
  }

  async approve(id: string): Promise<void> {
    const report = await this.repository.findOne({
      where: { id },
      relations: { project: true, writtenBy: true },
    });
    if (!report) throw new NotFoundException("Report not found");

    await this.projectService.setStatus(
      report.project.id,
      ProjectStatusEnum.SUSPENDED,
    );

    await this.userService.report(report.writtenBy.id);

    report.approved = true;
    await this.repository.save(report);
  }

  async reject(id: string): Promise<void> {
    const report = await this.repository.findOne({
      where: { id },
      relations: { project: true, writtenBy: true },
    });
    if (!report) throw new NotFoundException("Report not found");

    report.approved = false;

    await this.repository.save(report);
  }

  async findByUser(
    userId: string,
    relations?: FindOptionsRelations<ReportEntity>,
    page?: number,
  ): Promise<ReportEntity[]> {
    return await this.repository.find({
      where: { writtenBy: { id: userId } },
      relations,
      skip: page ? (Math.max(1, page) - 1) * 20 : 0,
      take: 20,
    });
  }

  async findById(
    id: string,
    relations?: FindOptionsRelations<ReportEntity>,
  ): Promise<ReportEntity> {
    const report = await this.repository.findOne({ where: { id }, relations });
    if (!report) throw new NotFoundException("Report not found");

    return report;
  }

  async update(data: IUpdateReport): Promise<void> {
    const report = await this.repository.findOneBy({
      id: data.id,
      writtenBy: { id: data.userId },
    });
    if (!report) throw new NotFoundException("Report not found");

    report.title = data.title ?? report.title;
    report.body = data.body ?? report.body;

    await this.repository.save(report);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.repository.delete({ id, writtenBy: { id: userId } });
  }
}
