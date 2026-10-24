import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./services/Application.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { ProjectGuard } from "../project/guards/Project.guard";
import { ApplicationStatusEnum } from "../enums/ApplicationStatus.enum";

describe("ApplicationController", () => {
  let controller: ApplicationController;

  let applicationService: {
    create: jest.Mock;
    accept: jest.Mock;
    reject: jest.Mock;
    findIncoming: jest.Mock;
    findOutcoming: jest.Mock;
  };

  const userId = "user-123";
  const applicationId = "application-123";
  const projectId = "project-123";
  const createdAt = new Date("2026-10-20T10:00:00.000Z");
  const updatedAt = new Date("2026-10-21T12:00:00.000Z");

  const applicant = {
    id: userId,
    bio: "Backend developer",
    avatarUrl: "https://github.com/avatar.png",
    createdAt,
    login: "example-user",
  };

  const createApplicationEntity = (overrides = {}) => ({
    id: applicationId,
    applicant,
    project: {
      id: projectId,
      title: "Chance of Idea",
    },
    createdAt,
    updatedAt,
    status: ApplicationStatusEnum.PENDING,
    whyMe: "I have relevant experience",
    plan: "I will implement the missing features",
    portflioUrl: "https://github.com/example",
    rejectReason: null,
    ...overrides,
  });

  beforeEach(async () => {
    applicationService = {
      create: jest.fn(),
      accept: jest.fn(),
      reject: jest.fn(),
      findIncoming: jest.fn(),
      findOutcoming: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        {
          provide: ApplicationService,
          useValue: applicationService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ProjectGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApplicationController>(ApplicationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create an application with the request user's ID", async () => {
      const req = {
        user: { id: userId },
      } as any;

      const dto = {
        projectId,
        whyMe: "I have relevant experience",
        plan: "I will implement the missing features",
        porfolioUrl: "https://github.com/example",
      };

      await controller.create(req, dto);

      expect(applicationService.create).toHaveBeenCalledWith(
        {
          projectId: dto.projectId,
          whyMe: dto.whyMe,
          plan: dto.plan,
          portfolioUrl: dto.porfolioUrl,
        },
        userId,
      );

      expect(applicationService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("accept", () => {
    it("should accept the specified application", async () => {
      await controller.accept({ applicationId });

      expect(applicationService.accept).toHaveBeenCalledWith(applicationId);
      expect(applicationService.accept).toHaveBeenCalledTimes(1);
    });
  });

  describe("reject", () => {
    it("should reject the specified application with a reason", async () => {
      const rejectReason = "The application does not meet the requirements";

      await controller.reject({ applicationId }, { rejectReason });

      expect(applicationService.reject).toHaveBeenCalledWith(
        applicationId,
        rejectReason,
      );

      expect(applicationService.reject).toHaveBeenCalledTimes(1);
    });
  });

  describe("getIncoming", () => {
    it("should map incoming application entities to response DTOs", async () => {
      const req = {
        user: { id: userId },
      } as any;

      const entity = createApplicationEntity();

      applicationService.findIncoming.mockResolvedValue([entity]);

      await expect(controller.getIncoming(req)).resolves.toEqual([
        {
          id: applicationId,
          applicant,
          createdAt,
          status: ApplicationStatusEnum.PENDING,
          updatedAt,
          whyMe: "I have relevant experience",
          plan: "I will implement the missing features",
          portfolioUrl: "https://github.com/example",
          rejectReason: null,
          project: {
            id: "project-123",
            title: "Chance of Idea",
          },
        },
      ]);

      expect(applicationService.findIncoming).toHaveBeenCalledWith(userId);
      expect(applicationService.findIncoming).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when there are no incoming applications", async () => {
      const req = {
        user: { id: userId },
      } as any;

      applicationService.findIncoming.mockResolvedValue([]);

      await expect(controller.getIncoming(req)).resolves.toEqual([]);

      expect(applicationService.findIncoming).toHaveBeenCalledWith(userId);
    });
  });

  describe("getOutcoming", () => {
    it("should map outgoing application entities to response DTOs", async () => {
      const req = {
        user: { id: userId },
      } as any;

      const entity = createApplicationEntity({
        id: "application-456",
        whyMe: "I can finish this project",
        plan: "Refactor the backend and add tests",
        portflioUrl: "https://github.com/example/portfolio",
        project: { id: "project-1" },
      });

      applicationService.findOutcoming.mockResolvedValue([entity]);

      await expect(controller.getOutcoming(req)).resolves.toEqual([
        {
          id: "application-456",
          applicant,
          createdAt,
          status: ApplicationStatusEnum.PENDING,
          updatedAt,
          whyMe: "I can finish this project",
          plan: "Refactor the backend and add tests",
          portfolioUrl: "https://github.com/example/portfolio",
          rejectReason: null,
          project: { id: "project-1" },
        },
      ]);

      expect(applicationService.findOutcoming).toHaveBeenCalledWith(userId);
      expect(applicationService.findOutcoming).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when there are no outgoing applications", async () => {
      const req = {
        user: { id: userId },
      } as any;

      applicationService.findOutcoming.mockResolvedValue([]);

      await expect(controller.getOutcoming(req)).resolves.toEqual([]);

      expect(applicationService.findOutcoming).toHaveBeenCalledWith(userId);
    });
  });
});
