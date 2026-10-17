import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ICreateApplication } from "../../types/CraeteApplication.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { ApplicationEntity } from "../entities/Application.entity";
import { FindOptionsRelations, Not, Repository } from "typeorm";
import { ApplicationStatusEnum } from "../../enums/ApplicationStatus.enum";
import { DataSource } from "typeorm/browser";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TransferSessionEntity } from "../../transfer-session/entities/TransferSession.entity";
import { UserEntity } from "../../user/entities/User.entity";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";

interface IApplicationService {
  create(data: ICreateApplication, userId: string): Promise<void>;
  findById(
    id: string,
    relations?: FindOptionsRelations<ApplicationEntity>,
  ): Promise<ApplicationEntity>;
  accept(id: string): Promise<void>;
  reject(id: string): Promise<void>;
}

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly repository: Repository<ApplicationEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: ICreateApplication, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Serialize application creation for this project.
      await manager.getRepository(ProjectEntity).findOneOrFail({
        where: { id: data.projectId },
        lock: { mode: "pessimistic_write" }, // lock the row
      });

      const applicationRepository = manager.getRepository(ApplicationEntity);

      const count = await applicationRepository.count({
        where: {
          project: { id: data.projectId },
          applicant: { id: userId },
        },
      });

      if (count >= 3) {
        throw new BadRequestException(
          "More than 3 applications per project are not allowed",
        );
      }

      const hasNonRejected = await applicationRepository.exists({
        where: {
          project: { id: data.projectId },
          applicant: { id: userId },
          status: Not(ApplicationStatusEnum.REJECTED),
        },
      });

      if (hasNonRejected) {
        throw new ConflictException(
          "You already have an active application for this project",
        );
      }

      await applicationRepository.save({
        ...data,
        project: { id: data.projectId },
        applicant: { id: userId },
      });
    });
  }

  async findById(
    id: string,
    relations?: FindOptionsRelations<ApplicationEntity>,
  ): Promise<ApplicationEntity> {
    const application = await this.repository.findOne({
      where: { id },
      relations,
    });
    if (!application) throw new NotFoundException("Application not found");

    return application;
  }

  async reject(id: string): Promise<void> {
    const application = await this.findById(id);

    application.status = ApplicationStatusEnum.REJECTED;

    await this.repository.save(application);
  }

  async accept(id: string): Promise<void> {
    const transferSessionId = await this.dataSource.transaction(
      async (manager) => {
        const repository = manager.getRepository(ApplicationEntity);
        const projectRepository = manager.getRepository(ProjectEntity);

        const acceptedApplicationExists = await repository.exists({
          where: { status: ApplicationStatusEnum.ACCEPTED },
          lock: { mode: "pessimistic_write" },
        });

        if (acceptedApplicationExists)
          throw new ConflictException("One of application is already accepted");

        const application = await repository.findOne({
          where: { id },
          relations: { project: true, applicant: true },
        });

        if (!application) throw new NotFoundException("Application not found");

        application.status = ApplicationStatusEnum.ACCEPTED;
        await repository.save(application);

        const project = application.project;
        if (project.status == ProjectStatusEnum.TRANSFERRING) throw new BadRequestException("Project is already being transfered");

        project.status = ProjectStatusEnum.TRANSFERRING;

        await projectRepository.save(project);

        const transferSessionRepository = manager.getRepository(
          TransferSessionEntity,
        );

        const transferSession = await transferSessionRepository.save({
          applicant: application.applicant,
          project,
        });

        return transferSession.id;
      },
    );

    this.eventEmitter.emit("application.accepted", {
      transferSessionId,
    });
  }
}
