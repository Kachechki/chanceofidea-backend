import { Test, TestingModule } from "@nestjs/testing";
import { ProjectService } from "./services/Project.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { ProjectGuard } from "./guards/Project.guard";
import { ProjectController } from "./project.controller";

describe("ProjectController", () => {
  let controller: ProjectController;
  let projectService: {
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    publish: jest.Mock;
    search: jest.Mock;
  };

  beforeEach(async () => {
    projectService = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      publish: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: projectService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ProjectGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a project using the authenticated user's ID", async () => {
      const dto = {
        title: "My project",
        description: "A test project",
        categoryId: "category-1",
        tags: ["tag-1"],
        repositoryName: "my-repository",
        publish: false,
      } as any;

      const req = {
        user: { id: "user-1" },
      };

      await expect(controller.create(dto, req as any)).resolves.toBeUndefined();

      expect(projectService.create).toHaveBeenCalledTimes(1);
      expect(projectService.create).toHaveBeenCalledWith({
        ...dto,
        ownerId: "user-1",
      });
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Creation failed");
      projectService.create.mockRejectedValue(error);

      await expect(
        controller.create({} as any, { user: { id: "user-1" } } as any),
      ).rejects.toThrow(error);
    });
  });

  describe("get", () => {
    const req = {
      user: { id: "user-1" },
    } as any;

    it("should find a project with its required relations", async () => {
      const project = {
        id: "project-1",
        title: "My project",
        category: { id: "category-1", name: "Backend" },
        createdAt: new Date(),
        description: "A test project",
        owner: {
          id: "user-1",
          avatarUrl: null,
          bio: null,
          createdAt: new Date(),
          login: "test-user",
        },
        repositoryName: "my-repo",
        status: "active",
        tags: [],
      };

      projectService.findById.mockResolvedValue(project);

      await expect(
        controller.get({ id: "project-1" } as any),
      ).resolves.toEqual({
        id: project.id,
        title: project.title,
        category: project.category,
        createdAt: project.createdAt,
        description: project.description,
        owner: project.owner,
        repositoryName: project.repositoryName,
        status: project.status,
        tags: project.tags,
      });

      expect(projectService.findById).toHaveBeenCalledTimes(1);
      expect(projectService.findById).toHaveBeenCalledWith(
        "project-1",
        {
          applications: true,
          category: true,
          owner: true,
          tags: true,
        },
      );
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Project not found");
      projectService.findById.mockRejectedValue(error);

      await expect(
        controller.get({ id: "missing-project" } as any),
      ).rejects.toThrow(error);
    });
  });

  describe("update", () => {
    it("should pass the update DTO to ProjectService", async () => {
      const dto = {
        id: "project-1",
        title: "Updated title",
      } as any;

      await expect(controller.update(dto)).resolves.toBeUndefined();

      expect(projectService.update).toHaveBeenCalledTimes(1);
      expect(projectService.update).toHaveBeenCalledWith(dto);
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Update failed");
      projectService.update.mockRejectedValue(error);

      await expect(
        controller.update({ id: "project-1" } as any),
      ).rejects.toThrow(error);
    });
  });

  describe("delete", () => {
    it("should delete the project specified by the query DTO", async () => {
      await expect(
        controller.delete({ id: "project-1" } as any),
      ).resolves.toBeUndefined();

      expect(projectService.delete).toHaveBeenCalledTimes(1);
      expect(projectService.delete).toHaveBeenCalledWith("project-1");
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Delete failed");
      projectService.delete.mockRejectedValue(error);

      await expect(
        controller.delete({ id: "project-1" } as any),
      ).rejects.toThrow(error);
    });
  });

  describe("publish", () => {
    it("should publish the project specified by the query DTO", async () => {
      await expect(
        controller.publish({ id: "project-1" } as any),
      ).resolves.toBeUndefined();

      expect(projectService.publish).toHaveBeenCalledTimes(1);
      expect(projectService.publish).toHaveBeenCalledWith("project-1");
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Publish failed");
      projectService.publish.mockRejectedValue(error);

      await expect(
        controller.publish({ id: "project-1" } as any),
      ).rejects.toThrow(error);
    });
  });

  describe("search", () => {
    it("should merge the search query and page parameter", async () => {
      const dto = {
        searchQuery: "nestjs backend",
        categorySlugs: ["backend"],
        tagSlugs: ["nestjs"],
        page: 2,
      };
      const projects = [{ id: "project-1" }];

      projectService.search.mockResolvedValue(projects);

      await expect(controller.search(dto as any)).resolves.toBe(projects);

      expect(projectService.search).toHaveBeenCalledTimes(1);
      expect(projectService.search).toHaveBeenCalledWith({
        ...dto,
      });
    });

    it("should propagate errors from ProjectService", async () => {
      const error = new Error("Search failed");
      projectService.search.mockRejectedValue(error);

      await expect(controller.search({} as any)).rejects.toThrow(error);
    });
  });
});
