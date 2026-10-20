import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Not } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { ApplicationService } from "./Application.service";
import { ApplicationEntity } from "../entities/Application.entity";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { TransferSessionEntity } from "../../transfer-session/entities/TransferSession.entity";
import { UserEntity } from "../../user/entities/User.entity";
import { ApplicationStatusEnum } from "../../enums/ApplicationStatus.enum";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";
import { ProjectService } from "../../project/services/Project.service";
import { UserService } from "../../user/services/User.service";

describe("ApplicationService", () => {
  let service: ApplicationService;

  let applicationRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  let dataSource: {
    transaction: jest.Mock;
  };

  let manager: {
    getRepository: jest.Mock;
  };

  let projectRepository: {
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };

  let transactionApplicationRepository: {
    count: jest.Mock;
    exists: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };

  let userRepository: {
    findOne: jest.Mock;
  };

  let transferSessionRepository: {
    save: jest.Mock;
  };

  let eventEmitter: {
    emit: jest.Mock;
  };

  let userService: {
    findById: jest.Mock;
  };

  let projectService: {
    findByUser: jest.Mock;
  };

  const projectId = "project-1";
  const userId = "user-1";
  const applicationId = "application-1";

  const project = {
    id: projectId,
    status: ProjectStatusEnum.PUBLISHED,
  };

  const applicant = {
    id: userId,
  };

  const application = {
    id: applicationId,
    status: ApplicationStatusEnum.PENDING,
    project,
    applicant,
    rejectReason: undefined,
  };

  beforeEach(async () => {
    applicationRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    projectRepository = {
      findOneOrFail: jest.fn().mockResolvedValue(project),
      save: jest.fn().mockImplementation(async (value) => value),
    };

    transactionApplicationRepository = {
      count: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: userId,
        projects: [],
      }),
    };

    transferSessionRepository = {
      save: jest.fn().mockResolvedValue({
        id: "transfer-session-1",
      }),
    };

    manager = {
      getRepository: jest.fn((entity) => {
        if (entity === ProjectEntity) return projectRepository;
        if (entity === ApplicationEntity)
          return transactionApplicationRepository;
        if (entity === UserEntity) return userRepository;
        if (entity === TransferSessionEntity) return transferSessionRepository;

        throw new Error(`Unexpected repository: ${entity.name}`);
      }),
    };

    dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    userService = {
      findById: jest.fn(),
    };

    projectService = {
      findByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: applicationRepository,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: UserService, useValue: userService },
        { provide: ProjectService, useValue: projectService },
      ],
    }).compile();

    service = module.get<ApplicationService>(ApplicationService);
  });

  describe("create", () => {
    const data = { projectId };

    it("creates a pending application inside a transaction", async () => {
      await service.create(data as any, userId);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);

      expect(projectRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: projectId },
        lock: { mode: "pessimistic_write" },
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: { projects: true },
      });

      expect(transactionApplicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          project: { id: projectId },
          applicant: { id: userId },
          status: ApplicationStatusEnum.PENDING,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
    });

    it("throws NotFoundException when the user does not exist", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(data as any, userId)).rejects.toThrow(
        new NotFoundException("User not found"),
      );

      expect(transactionApplicationRepository.save).not.toHaveBeenCalled();
    });

    it("prevents users from applying to their own projects", async () => {
      userRepository.findOne.mockResolvedValue({
        id: userId,
        projects: [{ id: projectId }],
      });

      await expect(service.create(data as any, userId)).rejects.toThrow(
        new BadRequestException("User cannot submit an application to himself"),
      );

      expect(transactionApplicationRepository.save).not.toHaveBeenCalled();
    });

    it("rejects a fourth application for the same project", async () => {
      transactionApplicationRepository.count.mockResolvedValue(3);

      await expect(service.create(data as any, userId)).rejects.toThrow(
        new BadRequestException(
          "More than 3 applications per project are not allowed",
        ),
      );

      expect(transactionApplicationRepository.count).toHaveBeenCalledWith({
        where: {
          project: { id: projectId },
          applicant: { id: userId },
        },
      });

      expect(transactionApplicationRepository.save).not.toHaveBeenCalled();
    });

    it("rejects an application when an active application already exists", async () => {
      transactionApplicationRepository.exists.mockResolvedValue(true);

      await expect(service.create(data as any, userId)).rejects.toThrow(
        new ConflictException(
          "You already have an active application for this project",
        ),
      );

      expect(transactionApplicationRepository.exists).toHaveBeenCalledWith({
        where: {
          project: { id: projectId },
          applicant: { id: userId },
          status: Not(ApplicationStatusEnum.REJECTED),
        },
      });

      expect(transactionApplicationRepository.save).not.toHaveBeenCalled();
    });

    it("allows a new application when previous applications were rejected", async () => {
      transactionApplicationRepository.exists.mockResolvedValue(false);

      await expect(
        service.create(data as any, userId),
      ).resolves.toBeUndefined();

      expect(transactionApplicationRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("returns the application", async () => {
      applicationRepository.findOne.mockResolvedValue(application);

      await expect(service.findById(applicationId)).resolves.toBe(application);

      expect(applicationRepository.findOne).toHaveBeenCalledWith({
        where: { id: applicationId },
        relations: undefined,
      });
    });

    it("passes requested relations to the repository", async () => {
      applicationRepository.findOne.mockResolvedValue(application);

      await service.findById(applicationId, {
        project: true,
        applicant: true,
      });

      expect(applicationRepository.findOne).toHaveBeenCalledWith({
        where: { id: applicationId },
        relations: { project: true, applicant: true },
      });
    });

    it("throws NotFoundException when the application does not exist", async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(applicationId)).rejects.toThrow(
        new NotFoundException("Application not found"),
      );
    });
  });

  describe("reject", () => {
    it("marks an application as rejected", async () => {
      applicationRepository.findOne.mockResolvedValue({
        ...application,
      });

      await service.reject(applicationId);

      expect(applicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: applicationId,
          status: ApplicationStatusEnum.REJECTED,
        }),
      );
    });

    it("stores the rejection reason", async () => {
      applicationRepository.findOne.mockResolvedValue({
        ...application,
      });

      await service.reject(applicationId, "Not a good fit");

      expect(applicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ApplicationStatusEnum.REJECTED,
          rejectReason: "Not a good fit",
        }),
      );
    });

    it("preserves the existing reason when no new reason is provided", async () => {
      applicationRepository.findOne.mockResolvedValue({
        ...application,
        rejectReason: "Previous reason",
      });

      await service.reject(applicationId);

      expect(applicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          rejectReason: "Previous reason",
        }),
      );
    });

    it("does not save when the application does not exist", async () => {
      applicationRepository.findOne.mockResolvedValue(null);

      await expect(service.reject(applicationId)).rejects.toThrow(
        NotFoundException,
      );

      expect(applicationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("accept", () => {
    beforeEach(() => {
      transactionApplicationRepository.findOne.mockResolvedValue({
        ...application,
        project: { ...project },
        applicant: { ...applicant },
      });
    });

    it("accepts the application and starts a transfer session", async () => {
      await service.accept(applicationId);

      expect(transactionApplicationRepository.exists).toHaveBeenCalledWith({
        where: { status: ApplicationStatusEnum.ACCEPTED },
        lock: { mode: "pessimistic_write" },
      });

      expect(transactionApplicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ApplicationStatusEnum.ACCEPTED,
        }),
      );

      expect(projectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: projectId,
          status: ProjectStatusEnum.TRANSFERRING,
        }),
      );

      expect(transferSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          applicant: expect.objectContaining({ id: userId }),
          project: expect.objectContaining({ id: projectId }),
          createdAt: expect.any(Date),
        }),
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith("application.accepted", {
        transferSessionId: "transfer-session-1",
      });
    });

    it("throws ConflictException if another application is already accepted", async () => {
      transactionApplicationRepository.exists.mockResolvedValue(true);

      await expect(service.accept(applicationId)).rejects.toThrow(
        new ConflictException("One of application is already accepted"),
      );

      expect(transactionApplicationRepository.findOne).not.toHaveBeenCalled();
      expect(transferSessionRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the application does not exist", async () => {
      transactionApplicationRepository.findOne.mockResolvedValue(null);

      await expect(service.accept(applicationId)).rejects.toThrow(
        new NotFoundException("Application not found"),
      );

      expect(transferSessionRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("rejects a project that is already being transferred", async () => {
      transactionApplicationRepository.findOne.mockResolvedValue({
        ...application,
        project: {
          ...project,
          status: ProjectStatusEnum.TRANSFERRING,
        },
        applicant: { ...applicant },
      });

      await expect(service.accept(applicationId)).rejects.toThrow(
        new BadRequestException("Project is already being transfered"),
      );

      expect(transferSessionRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe("findIncoming", () => {
    it("returns applications belonging to the user's projects", async () => {
      const applications = [{ id: "application-1" }, { id: "application-2" }];

      projectService.findByUser.mockResolvedValue([
        { id: "project-1", applications: [applications[0]] },
        { id: "project-2", applications: [applications[1]] },
      ]);

      await expect(service.findIncoming(userId)).resolves.toEqual(applications);

      expect(projectService.findByUser).toHaveBeenCalledWith(userId, {
        applications: { applicant: true },
      });
    });

    it("returns an empty array when the user has no projects", async () => {
      projectService.findByUser.mockResolvedValue([]);

      await expect(service.findIncoming(userId)).resolves.toEqual([]);
    });
  });

  describe("findOutcoming", () => {
    it("returns applications submitted by the user", async () => {
      const applications = [{ id: "application-1" }];

      userService.findById.mockResolvedValue({
        id: userId,
        applications,
      });

      await expect(service.findOutcoming(userId)).resolves.toBe(applications);

      expect(userService.findById).toHaveBeenCalledWith(userId, {
        applications: true,
      });
    });
  });
});
