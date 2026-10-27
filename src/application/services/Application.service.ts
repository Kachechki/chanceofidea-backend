import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ICreateApplication } from "../../types/CraeteApplication.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { ApplicationEntity } from "../entities/Application.entity";
import { DataSource, FindOptionsRelations, Not, Repository } from "typeorm";
import { ApplicationStatusEnum } from "../../enums/ApplicationStatus.enum";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TransferSessionEntity } from "../../transfer-session/entities/TransferSession.entity";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";
import { ProjectService } from "../../project/services/Project.service";
import { UserService } from "../../user/services/User.service";
import { UserEntity } from "../../user/entities/User.entity";

interface IApplicationService {
  create(data: ICreateApplication, userId: string): Promise<void>;
  findById(
    id: string,
    relations?: FindOptionsRelations<ApplicationEntity>,
  ): Promise<ApplicationEntity>;
  accept(id: string, userId: string): Promise<void>;
  reject(id: string, userId: string, reason?: string): Promise<void>;
  findIncoming(userId: string): Promise<ApplicationEntity[]>;
  findOutcoming(userId: string): Promise<ApplicationEntity[]>;
  findOwnedPending(id: string, userId: string): Promise<ApplicationEntity>;
}

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly repository: Repository<ApplicationEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
  ) {}

  async create(data: ICreateApplication, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Serialize application creation for this project.
      await manager.getRepository(ProjectEntity).findOneOrFail({
        where: { id: data.projectId },
        lock: { mode: "pessimistic_write" }, // lock the row
      });

      const applicationRepository = manager.getRepository(ApplicationEntity);
      const userRepository = manager.getRepository(UserEntity);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: { projects: true },
      });
      if (!user) throw new NotFoundException("User not found");

      if (user.projects.map((project) => project.id).includes(data.projectId))
        throw new BadRequestException(
          "User cannot submit an application to himself",
        );

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
        createdAt: new Date(),
        updatedAt: new Date(),
        status: ApplicationStatusEnum.PENDING,
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

  async reject(id: string, userId: string, reason?: string): Promise<void> {
    const application = await this.findOwnedPending(id, userId);

    application.status = ApplicationStatusEnum.REJECTED;
    if (reason) application.rejectReason = reason;

    await this.repository.save(application);
  }

  async accept(id: string, userId: string): Promise<void> {
    await this.findOwnedPending(id, userId);
    const transferSessionId = await this.dataSource.transaction(
      async (manager) => {
        const applicationRepository = manager.getRepository(ApplicationEntity);
        const projectRepository = manager.getRepository(ProjectEntity);
        const transferSessionRepository = manager.getRepository(
          TransferSessionEntity,
        );

        const application = await applicationRepository.findOne({
          where: { id },
          relations: { project: true, applicant: true },
        });

        if (!application) {
          throw new NotFoundException("Application not found");
        }

        // Serialize acceptance attempts for this project.
        const project = await projectRepository.findOne({
          where: { id: application.project.id },
          lock: { mode: "pessimistic_write" },
        });

        if (!project) {
          throw new NotFoundException("Project not found");
        }

        if (project.status === ProjectStatusEnum.TRANSFERRING) {
          throw new BadRequestException("Project is already being transferred");
        }

        const acceptedApplicationExists = await applicationRepository.exists({
          where: {
            project: { id: project.id },
            status: ApplicationStatusEnum.ACCEPTED,
          },
        });

        if (acceptedApplicationExists) {
          throw new ConflictException(
            "One of the applications for this project is already accepted",
          );
        }

        application.status = ApplicationStatusEnum.ACCEPTED;
        await applicationRepository.save(application);

        project.status = ProjectStatusEnum.TRANSFERRING;
        await projectRepository.save(project);

        const transferSession = await transferSessionRepository.save({
          applicant: application.applicant,
          project,
          createdAt: new Date(),
        });

        return transferSession.id;
      },
    );

    this.eventEmitter.emit("application.accepted", {
      transferSessionId,
    });
  }

  async findIncoming(userId: string): Promise<ApplicationEntity[]> {
    const projects = await this.projectService.findByUser(userId, {
      applications: { applicant: true },
    });

    return projects.flatMap((project) =>
      project.applications.map((application) => {
        application.project = project;
        return application;
      }),
    );
  }

  async findOutcoming(userId: string): Promise<ApplicationEntity[]> {
    const user = await this.userService.findById(userId, {
      applications: {
        applicant: true,
        project: true,
      },
    });

    return user.applications;
  }
  // loads the application and checks that userId owns its project
  async findOwnedPending(
    id: string,
    userId: string,
  ): Promise<ApplicationEntity> {
    const application = await this.findById(id, {
      project: { owner: true },
    });

    if (application.project.owner.id !== userId)
      throw new ForbiddenException("Only the project owner can decide");

    if (application.status !== ApplicationStatusEnum.PENDING)
      throw new ConflictException("Application is already decided");

    return application;
  }
}
