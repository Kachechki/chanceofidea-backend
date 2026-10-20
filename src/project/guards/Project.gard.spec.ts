import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ProjectGuard } from "./Project.guard";
import { ProjectService } from "../services/Project.service";

describe("ProjectGuard", () => {
  let guard: ProjectGuard;
  let projectService: { findById: jest.Mock };

  const createContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    projectService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectGuard,
        {
          provide: ProjectService,
          useValue: projectService,
        },
      ],
    }).compile();

    guard = module.get<ProjectGuard>(ProjectGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    const userId = "user-123";
    const projectId = "project-123";

    it("should throw InternalServerErrorException when the request has no user", async () => {
      const context = createContext({
        body: { id: projectId },
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(projectService.findById).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when no project ID is provided", async () => {
      const context = createContext({
        user: { id: userId },
        body: {},
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new BadRequestException("No project ID provided"),
      );

      expect(projectService.findById).not.toHaveBeenCalled();
    });

    it("should get the project ID from the request body", async () => {
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        body: { id: projectId },
        query: { id: "another-project" },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(projectService.findById).toHaveBeenCalledWith(projectId, {
        owner: true,
      });
    });

    it("should get the project ID from the query when the body is absent", async () => {
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        query: { id: projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(projectService.findById).toHaveBeenCalledWith(projectId, {
        owner: true,
      });
    });

    it("should return true when the authenticated user owns the project", async () => {
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        body: { id: projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it("should return false when another user owns the project", async () => {
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: "another-user" },
      });

      const context = createContext({
        user: { id: userId },
        body: { id: projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Database error");
      projectService.findById.mockRejectedValue(error);

      const context = createContext({
        user: { id: userId },
        body: { id: projectId },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(error);
    });
  });
});
