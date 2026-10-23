import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ProjectEntity } from "../entities/Project.entity";
import { ProjectService } from "./Project.service";
import { CategoryService } from "../../category/services/Category.sevice";
import { TagService } from "../../tag/services/Tag.service";
import { UserService } from "../../user/services/User.service";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";

describe("ProjectService", () => {
  let service: ProjectService;
  let repository: {
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let categoryService: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
  };
  let tagService: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
  };
  let userService: { findById: jest.Mock };
  let transferSessionService: { findById: jest.Mock };
  let fetchMock: jest.Mock;
  let originalFetch: typeof global.fetch;

  let queryBuilder: any;
  let subQueryBuilder: any;

  const makeResponse = (
    ok: boolean,
    status = ok ? 200 : 500,
    json: unknown = {},
  ): Response =>
    new Response(JSON.stringify(json), {
      status,
      headers: { "content-type": "application/json" },
    });

  beforeEach(async () => {
    originalFetch = global.fetch;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    categoryService = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
    };

    tagService = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
    };

    userService = {
      findById: jest.fn(),
    };

    transferSessionService = {
      findById: jest.fn(),
    };

    subQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue("(SELECT taggedProject.id)"),
    };

    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockImplementation((condition: unknown) => {
        if (typeof condition === "function") {
          condition(queryBuilder);
        }
        return queryBuilder;
      }),
      subQuery: jest.fn().mockReturnValue(subQueryBuilder),
      setParameters: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(ProjectEntity),
          useValue: repository,
        },
        { provide: CategoryService, useValue: categoryService },
        { provide: TagService, useValue: tagService },
        { provide: UserService, useValue: userService },
        {
          provide: TransferSessionService,
          useValue: transferSessionService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("create", () => {
    const data = {
      title: "My Project",
      description: "A test project",
      categoryId: "category-1",
      tags: ["tag-1", "tag-2"],
      ownerId: "user-1",
      repositoryName: "submitted-repo-name",
      publish: true,
      readiness: 0.5,
    } as any;

    const category = { id: "category-1", name: "Backend" };
    const tag1 = { id: "tag-1", name: "NestJS" };
    const tag2 = { id: "tag-2", name: "TypeScript" };
    const owner = { id: "user-1", login: "github-owner" };

    beforeEach(() => {
      categoryService.findById.mockResolvedValue(category);
      tagService.findById
        .mockResolvedValueOnce(tag1)
        .mockResolvedValueOnce(tag2);
      userService.findById.mockResolvedValue(owner);
      fetchMock.mockResolvedValue(
        makeResponse(true, 200, { name: "actual-repo-name" }),
      );
    });

    it("should resolve the category, tags, owner, and GitHub repository", async () => {
      await service.create(data);

      expect(categoryService.findById).toHaveBeenCalledWith("category-1");
      expect(tagService.findById).toHaveBeenNthCalledWith(1, "tag-1");
      expect(tagService.findById).toHaveBeenNthCalledWith(2, "tag-2");
      expect(userService.findById).toHaveBeenCalledWith("user-1");
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://api.github.com/repos/github-owner/submitted-repo-name",
      );
    });

    it("should save the project with resolved relations and published status", async () => {
      await service.create(data);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          categoryName: undefined,
          tagNames: undefined,
          category,
          tags: [tag1, tag2],
          status: ProjectStatusEnum.PUBLISHED,
          owner,
          repositoryName: "actual-repo-name",
          createdAt: expect.any(Date),
        }),
      );
    });

    it("should save the project as a draft when publish is false", async () => {
      await service.create({ ...data, publish: false });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProjectStatusEnum.DRAFT,
        }),
      );
    });

    it("should reject creation when no tags are provided", async () => {
      await expect(service.create({ ...data, tags: [] })).rejects.toThrow(
        new BadRequestException("No project tags provided"),
      );

      expect(userService.findById).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate category lookup errors", async () => {
      const error = new Error("Category lookup failed");
      categoryService.findById.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow(error);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate tag lookup errors", async () => {
      const error = new Error("Tag lookup failed");

      tagService.findById.mockReset();
      tagService.findById.mockRejectedValueOnce(error);

      await expect(service.create(data)).rejects.toThrow(error);

      expect(userService.findById).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate user lookup errors", async () => {
      const error = new Error("User not found");
      userService.findById.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow(error);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should throw when GitHub returns an unsuccessful response", async () => {
      fetchMock.mockResolvedValue(makeResponse(false, 404));

      await expect(service.create(data)).rejects.toThrow(
        "GitHub repository not found or inaccessible",
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate network errors from GitHub", async () => {
      const error = new Error("Network failure");
      fetchMock.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow(/Network failure/);
      expect(repository.save).not.toHaveBeenCalled();
    }, 20_000);

    it("should propagate repository save errors", async () => {
      const error = new Error("Database save failed");
      repository.save.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow(error);
    });
  });

  describe("findById", () => {
    it("should return the project when found", async () => {
      const project = { id: "project-1" } as ProjectEntity;
      repository.findOne.mockResolvedValue(project);

      await expect(service.findById("project-1")).resolves.toBe(project);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: "project-1" },
        relations: undefined,
      });
    });

    it("should pass requested relations to the repository", async () => {
      const project = { id: "project-1" } as ProjectEntity;
      repository.findOne.mockResolvedValue(project);

      await service.findById("project-1", {
        owner: true,
        category: true,
      });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: "project-1" },
        relations: { owner: true, category: true },
      });
    });

    it("should throw NotFoundException when the project does not exist", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById("missing-id")).rejects.toThrow(
        new NotFoundException("Project not found"),
      );
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.findOne.mockRejectedValue(error);

      await expect(service.findById("project-1")).rejects.toThrow(error);
    });
  });

  describe("update", () => {
    const data = {
      id: "project-1",
      title: "Updated title",
    } as any;

    it("should save the updated project", async () => {
      const project = {
        id: "project-1",
        status: ProjectStatusEnum.DRAFT,
      };
      repository.findOne.mockResolvedValue(project);

      await service.update(data);

      expect(repository.save).toHaveBeenCalledWith({
        ...data,
        category: undefined,
        tags: undefined,
      });
    });

    it("should resolve a category when category is provided", async () => {
      const category = { id: "category-1" };
      repository.findOne.mockResolvedValue({
        id: "project-1",
        status: ProjectStatusEnum.DRAFT,
      });
      categoryService.findById.mockResolvedValue(category);

      await service.update({ ...data, category: "category-1" });

      expect(categoryService.findById).toHaveBeenCalledWith("category-1");
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ category }),
      );
    });

    it("should resolve all tags when tags are provided", async () => {
      const tag1 = { id: "tag-1" };
      const tag2 = { id: "tag-2" };

      repository.findOne.mockResolvedValue({
        id: "project-1",
        status: ProjectStatusEnum.DRAFT,
      });
      tagService.findById
        .mockResolvedValueOnce(tag1)
        .mockResolvedValueOnce(tag2);

      await service.update({ ...data, tags: ["tag-1", "tag-2"] });

      expect(tagService.findById).toHaveBeenNthCalledWith(1, "tag-1");
      expect(tagService.findById).toHaveBeenNthCalledWith(2, "tag-2");
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [tag1, tag2] }),
      );
    });

    it.each([ProjectStatusEnum.TRANSFERRING, ProjectStatusEnum.ADOPTED])(
      "should reject updates when project status is %s",
      async (status) => {
        repository.findOne.mockResolvedValue({
          id: "project-1",
          status,
        });

        await expect(service.update(data)).rejects.toThrow(BadRequestException);

        expect(repository.save).not.toHaveBeenCalled();
      },
    );

    it("should propagate errors while resolving the category", async () => {
      const error = new Error("Category lookup failed");
      categoryService.findById.mockRejectedValue(error);

      await expect(
        service.update({ ...data, category: "category-1" }),
      ).rejects.toThrow(error);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate errors while resolving tags", async () => {
      const error = new Error("Tag lookup failed");
      tagService.findById.mockRejectedValue(error);

      await expect(
        service.update({ ...data, tags: ["tag-1"] }),
      ).rejects.toThrow(error);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate errors when finding the project", async () => {
      const error = new NotFoundException("Project not found");
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(data)).rejects.toThrow(error);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a project that can be deleted", async () => {
      repository.findOne.mockResolvedValue({
        id: "project-1",
        status: ProjectStatusEnum.DRAFT,
      });

      await service.delete("project-1");

      expect(repository.delete).toHaveBeenCalledWith("project-1");
    });

    it.each([ProjectStatusEnum.TRANSFERRING, ProjectStatusEnum.ADOPTED])(
      "should reject deletion when project status is %s",
      async (status) => {
        repository.findOne.mockResolvedValue({
          id: "project-1",
          status,
        });

        await expect(service.delete("project-1")).rejects.toThrow(
          BadRequestException,
        );

        expect(repository.delete).not.toHaveBeenCalled();
      },
    );

    it("should propagate errors when finding the project", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete("missing-id")).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it("should propagate repository delete errors", async () => {
      repository.findOne.mockResolvedValue({
        id: "project-1",
        status: ProjectStatusEnum.DRAFT,
      });

      const error = new Error("Delete failed");
      repository.delete.mockRejectedValue(error);

      await expect(service.delete("project-1")).rejects.toThrow(error);
    });
  });

  describe("publish", () => {
    it.each([ProjectStatusEnum.DRAFT, ProjectStatusEnum.PUBLISHED])(
      "should publish a project currently in status %s",
      async (status) => {
        const project = { id: "project-1", status };
        repository.findOne.mockResolvedValue(project);

        await service.publish("project-1");

        expect(project.status).toBe(ProjectStatusEnum.PUBLISHED);
        expect(repository.save).toHaveBeenCalledWith(project);
      },
    );

    it.each([ProjectStatusEnum.TRANSFERRING, ProjectStatusEnum.ADOPTED])(
      "should reject publishing when project status is %s",
      async (status) => {
        repository.findOne.mockResolvedValue({
          id: "project-1",
          status,
        });

        await expect(service.publish("project-1")).rejects.toThrow(
          new BadRequestException("Invalid current project state"),
        );

        expect(repository.save).not.toHaveBeenCalled();
      },
    );

    it("should throw when the project does not exist", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.publish("missing-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should propagate repository save errors", async () => {
      const project = {
        id: "project-1",
        status: ProjectStatusEnum.DRAFT,
      };
      repository.findOne.mockResolvedValue(project);
      const error = new Error("Save failed");
      repository.save.mockRejectedValue(error);

      await expect(service.publish("project-1")).rejects.toThrow(error);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      queryBuilder.getMany.mockResolvedValue([]);
    });

    it("should create a query builder and join category and tags", async () => {
      await service.search({ page: 1 } as any);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith("project");
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "project.category",
        "category",
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "project.tags",
        "tag",
      );
    });

    it("should apply the default pagination for page 1", async () => {
      await service.search({ page: 1 } as any);

      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
    });

    it("should apply pagination for later pages", async () => {
      await service.search({ page: 3 } as any);

      expect(queryBuilder.skip).toHaveBeenCalledWith(40);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it("should clamp page numbers below 1 to page 1", async () => {
      await service.search({ page: 0 } as any);

      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it("should filter by a single category slug", async () => {
      const category = { id: "category-1" };
      categoryService.findBySlug.mockResolvedValue(category);

      await service.search({
        page: 1,
        categorySlugs: "backend",
      } as any);

      expect(categoryService.findBySlug).toHaveBeenCalledWith("backend");
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "category.id IN (:...categoryIds)",
        { categoryIds: ["category-1"] },
      );
    });

    it("should filter by multiple category slugs", async () => {
      categoryService.findBySlug
        .mockResolvedValueOnce({ id: "category-1" })
        .mockResolvedValueOnce({ id: "category-2" });

      await service.search({
        page: 1,
        categorySlugs: ["backend", "frontend"],
      } as any);

      expect(categoryService.findBySlug).toHaveBeenNthCalledWith(1, "backend");
      expect(categoryService.findBySlug).toHaveBeenNthCalledWith(2, "frontend");
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "category.id IN (:...categoryIds)",
        { categoryIds: ["category-1", "category-2"] },
      );
    });

    it("should filter by tags and require all selected tags to match", async () => {
      tagService.findBySlug
        .mockResolvedValueOnce({ id: "tag-1" })
        .mockResolvedValueOnce({ id: "tag-2" });

      await service.search({
        page: 1,
        tagSlugs: ["nestjs", "postgres"],
      } as any);

      expect(tagService.findBySlug).toHaveBeenNthCalledWith(1, "nestjs");
      expect(tagService.findBySlug).toHaveBeenNthCalledWith(2, "postgres");
      expect(subQueryBuilder.select).toHaveBeenCalledWith("taggedProject.id");
      expect(subQueryBuilder.from).toHaveBeenCalledWith(
        ProjectEntity,
        "taggedProject",
      );
      expect(subQueryBuilder.innerJoin).toHaveBeenCalledWith(
        "taggedProject.tags",
        "matchedTag",
      );
      expect(subQueryBuilder.where).toHaveBeenCalledWith(
        "matchedTag.id IN (:...tagIds)",
      );
      expect(subQueryBuilder.groupBy).toHaveBeenCalledWith("taggedProject.id");
      expect(subQueryBuilder.having).toHaveBeenCalledWith(
        "COUNT(DISTINCT matchedTag.id) = :tagCount",
      );
      expect(queryBuilder.setParameters).toHaveBeenCalledWith({
        tagIds: ["tag-1", "tag-2"],
        tagCount: 2,
      });
    });

    it("should apply each word of the search query as a title filter", async () => {
      await service.search({
        page: 1,
        searchQuery: "  nestjs   backend ",
      } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "project.title ILIKE :searchWord0",
        { searchWord0: "%nestjs%" },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "project.title ILIKE :searchWord1",
        { searchWord1: "%backend%" },
      );
    });

    it("should skip empty search words", async () => {
      await service.search({
        page: 1,
        searchQuery: "   ",
      } as any);

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it("should return projects from the query builder", async () => {
      const projects = [{ id: "project-1" }, { id: "project-2" }];
      queryBuilder.getMany.mockResolvedValue(projects);

      await expect(service.search({ page: 1 } as any)).resolves.toBe(projects);
    });

    it("should propagate category lookup errors", async () => {
      const error = new Error("Category lookup failed");
      categoryService.findBySlug.mockRejectedValue(error);

      await expect(
        service.search({
          page: 1,
          categorySlugs: "backend",
        } as any),
      ).rejects.toThrow(error);

      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should propagate tag lookup errors", async () => {
      const error = new Error("Tag lookup failed");
      tagService.findBySlug.mockRejectedValue(error);

      await expect(
        service.search({
          page: 1,
          tagSlugs: "nestjs",
        } as any),
      ).rejects.toThrow(error);

      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should propagate query builder errors", async () => {
      const error = new Error("Query failed");
      queryBuilder.getMany.mockRejectedValue(error);

      await expect(service.search({ page: 1 } as any)).rejects.toThrow(error);
    });
  });

  describe("handleTransferTerminated", () => {
    const transferSessionId = "transfer-1";

    it.each([
      [true, ProjectStatusEnum.DRAFT],
      [false, ProjectStatusEnum.PUBLISHED],
    ])(
      "should set the project status to %s when failed is %s",
      async (failed, expectedStatus) => {
        const project = {
          id: "project-1",
          status: ProjectStatusEnum.TRANSFERRING,
        };
        transferSessionService.findById.mockResolvedValue({ project });

        await service.handleTransferTerminated(
          transferSessionId,
          failed as boolean,
        );

        expect(transferSessionService.findById).toHaveBeenCalledWith(
          transferSessionId,
          { project: true },
        );
        expect(project.status).toBe(expectedStatus);
        expect(repository.save).toHaveBeenCalledWith(project);
      },
    );

    it("should propagate transfer session lookup errors", async () => {
      const error = new Error("Transfer session not found");
      transferSessionService.findById.mockRejectedValue(error);

      await expect(
        service.handleTransferTerminated(transferSessionId, true),
      ).rejects.toThrow(error);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository save errors", async () => {
      const project = {
        id: "project-1",
        status: ProjectStatusEnum.TRANSFERRING,
      };
      transferSessionService.findById.mockResolvedValue({ project });
      const error = new Error("Save failed");
      repository.save.mockRejectedValue(error);

      await expect(
        service.handleTransferTerminated(transferSessionId, true),
      ).rejects.toThrow(error);
    });
  });

  describe("handleTransferSuccess", () => {
    it("should mark the project as adopted and save it", async () => {
      const project = {
        id: "project-1",
        status: ProjectStatusEnum.TRANSFERRING,
      };
      transferSessionService.findById.mockResolvedValue({ project });

      await service.handleTransferSuccess("transfer-1");

      expect(transferSessionService.findById).toHaveBeenCalledWith(
        "transfer-1",
        { project: true },
      );
      expect(project.status).toBe(ProjectStatusEnum.ADOPTED);
      expect(repository.save).toHaveBeenCalledWith(project);
    });

    it("should propagate transfer session lookup errors", async () => {
      const error = new Error("Transfer session not found");
      transferSessionService.findById.mockRejectedValue(error);

      await expect(service.handleTransferSuccess("transfer-1")).rejects.toThrow(
        error,
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository save errors", async () => {
      const project = {
        id: "project-1",
        status: ProjectStatusEnum.TRANSFERRING,
      };
      transferSessionService.findById.mockResolvedValue({ project });
      const error = new Error("Save failed");
      repository.save.mockRejectedValue(error);

      await expect(service.handleTransferSuccess("transfer-1")).rejects.toThrow(
        error,
      );
    });
  });

  describe("findByUser", () => {
    it("should return projects belonging to the specified user", async () => {
      const projects = [{ id: "project-1" }, { id: "project-2" }];
      repository.find.mockResolvedValue(projects);

      await expect(
        service.findByUser("user-1", { category: true, tags: true }),
      ).resolves.toBe(projects);

      expect(repository.find).toHaveBeenCalledWith({
        where: { owner: { id: "user-1" } },
        relations: { category: true, tags: true },
      });
    });

    it("should return an empty array when the user has no projects", async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.findByUser("user-1", {})).resolves.toEqual([]);
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.find.mockRejectedValue(error);

      await expect(service.findByUser("user-1", {})).rejects.toThrow(error);
    });
  });
});
