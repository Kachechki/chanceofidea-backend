
import { Test, TestingModule } from "@nestjs/testing";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./services/Application.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { ProjectGuard } from "../project/guards/Project.guard";

describe("ApplicationController", () => {
  let controller: ApplicationController;
  let applicationService: {
    create: jest.Mock;
    accept: jest.Mock;
    reject: jest.Mock;
    findIncoming: jest.Mock;
    findOutcoming: jest.Mock;
  };

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
        user: { id: "user-123" },
      } as any;

      const dto = {
        projectId: "project-123",
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
        "user-123",
      );
      expect(applicationService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("accept", () => {
    it("should accept the specified application", async () => {
      await controller.accept({
        applicationId: "application-123",
      });

      expect(applicationService.accept).toHaveBeenCalledWith(
        "application-123",
      );
      expect(applicationService.accept).toHaveBeenCalledTimes(1);
    });
  });

  describe("reject", () => {
    it("should reject the specified application with a reason", async () => {
      await controller.reject(
        { applicationId: "application-123" },
        { rejectReason: "The application does not meet the requirements" },
      );

      expect(applicationService.reject).toHaveBeenCalledWith(
        "application-123",
        "The application does not meet the requirements",
      );
      expect(applicationService.reject).toHaveBeenCalledTimes(1);
    });
  });

  describe("getIncoming", () => {
    it("should return incoming applications for the request user", async () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      const applications = [{ id: "application-1" }];
      applicationService.findIncoming.mockResolvedValue(applications);

      await expect(controller.getIncoming(req)).resolves.toBe(applications);

      expect(applicationService.findIncoming).toHaveBeenCalledWith(
        "user-123",
      );
      expect(applicationService.findIncoming).toHaveBeenCalledTimes(1);
    });
  });

  describe("getOutcoming", () => {
    it("should return outgoing applications for the request user", async () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      const applications = [{ id: "application-2" }];
      applicationService.findOutcoming.mockResolvedValue(applications);

      await expect(controller.getOutcoming(req)).resolves.toBe(applications);

      expect(applicationService.findOutcoming).toHaveBeenCalledWith(
        "user-123",
      );
      expect(applicationService.findOutcoming).toHaveBeenCalledTimes(1);
    });
  });
});
