import {
  BadRequestException,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Test, TestingModule } from "@nestjs/testing";
import { ProjectGuard } from "./Project.guard";
import { ProjectService } from "../services/Project.service";

describe("ProjectGuard", () => {
  let guard: ProjectGuard;
  let projectService: { findById: jest.Mock };
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
  };

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

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectGuard,
        {
          provide: ProjectService,
          useValue: projectService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
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
        body: { projectId },
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(cacheManager.get).not.toHaveBeenCalled();
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

      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(projectService.findById).not.toHaveBeenCalled();
    });

    it("should get the project ID from the request body", async () => {
      cacheManager.get.mockResolvedValue(undefined);
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        body: { projectId },
        query: { projectId: "another-project" },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheManager.get).toHaveBeenCalledWith(projectId);
      expect(projectService.findById).toHaveBeenCalledWith(projectId, {
        owner: true,
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        projectId,
        userId,
        1000 * 60 * 2,
      );
    });

    it("should get the project ID from the query when the body is absent", async () => {
      cacheManager.get.mockResolvedValue(undefined);
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        query: { projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheManager.get).toHaveBeenCalledWith(projectId);
      expect(projectService.findById).toHaveBeenCalledWith(projectId, {
        owner: true,
      });
    });

    it("should return true when the cached owner ID matches the authenticated user", async () => {
      cacheManager.get.mockResolvedValue(userId);

      const context = createContext({
        user: { id: userId },
        body: { projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheManager.get).toHaveBeenCalledWith(projectId);
      expect(projectService.findById).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it("should check the database when the cached owner ID belongs to another user", async () => {
      cacheManager.get.mockResolvedValue("another-user");
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        body: { projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(projectService.findById).toHaveBeenCalledWith(projectId, {
        owner: true,
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        projectId,
        userId,
        1000 * 60 * 2,
      );
    });

    it("should return true and cache the owner ID when the authenticated user owns the project", async () => {
      cacheManager.get.mockResolvedValue(undefined);
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: userId },
      });

      const context = createContext({
        user: { id: userId },
        body: { projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheManager.set).toHaveBeenCalledWith(
        projectId,
        userId,
        1000 * 60 * 2,
      );
    });

    it("should return false when another user owns the project", async () => {
      cacheManager.get.mockResolvedValue(undefined);
      projectService.findById.mockResolvedValue({
        id: projectId,
        owner: { id: "another-user" },
      });

      const context = createContext({
        user: { id: userId },
        body: { projectId },
      });

      await expect(guard.canActivate(context)).resolves.toBe(false);

      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it("should propagate errors from ProjectService", async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const error = new Error("Database error");
      projectService.findById.mockRejectedValue(error);

      const context = createContext({
        user: { id: userId },
        body: { projectId },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(error);
    });

    it("should propagate errors from the cache", async () => {
      const error = new Error("Cache error");
      cacheManager.get.mockRejectedValue(error);

      const context = createContext({
        user: { id: userId },
        body: { projectId },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(error);

      expect(projectService.findById).not.toHaveBeenCalled();
    });
  });
});
