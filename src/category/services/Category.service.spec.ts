import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryEntity } from "../entities/Category.entity";
import { CategoryService } from "./Category.sevice";

describe("CategoryService", () => {
  let service: CategoryService;
  let repository: jest.Mocked<
    Pick<Repository<CategoryEntity>, "findOneBy" | "save" | "find">
  >;

  beforeEach(async () => {
    repository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const data = { name: "  Artificial Intelligence  " };

    it("should generate a normalized slug and save the category", async () => {
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockResolvedValue({
        id: "category-123",
        name: data.name,
        slug: "artificial-intelligence",
      } as CategoryEntity);

      const result = await service.create(data);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        slug: "artificial-intelligence",
      });
      expect(repository.save).toHaveBeenCalledWith({
        name: data.name,
        slug: "artificial-intelligence",
      });
      expect(result).toBe("category-123");
    });

    it("should lowercase and trim the name when generating the slug", async () => {
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockResolvedValue({
        id: "category-123",
      } as CategoryEntity);

      await service.create({ name: "  FRONTEND   DEVELOPMENT  " });

      expect(repository.save).toHaveBeenCalledWith({
        name: "  FRONTEND   DEVELOPMENT  ",
        slug: "frontend-development",
      });
    });

    it("should throw ConflictException if the slug already exists", async () => {
      repository.findOneBy.mockResolvedValue({
        id: "existing-category",
        name: "Frontend",
        slug: "frontend",
      } as CategoryEntity);

      await expect(service.create({ name: "Frontend" })).rejects.toThrow(
        ConflictException,
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository lookup errors", async () => {
      const error = new Error("Database error");
      repository.findOneBy.mockRejectedValue(error);

      await expect(service.create({ name: "Frontend" })).rejects.toThrow(error);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository save errors", async () => {
      const error = new Error("Failed to save category");
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockRejectedValue(error);

      await expect(service.create({ name: "Frontend" })).rejects.toThrow(error);
    });
  });

  describe("findById", () => {
    it("should return the category when found", async () => {
      const category = {
        id: "category-123",
        name: "Frontend",
        slug: "frontend",
      } as CategoryEntity;

      repository.findOneBy.mockResolvedValue(category);

      await expect(service.findById("category-123")).resolves.toBe(category);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: "category-123",
      });
    });

    it("should throw NotFoundException when the category does not exist", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findById("missing-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.findOneBy.mockRejectedValue(error);

      await expect(service.findById("category-123")).rejects.toThrow(error);
    });
  });

  describe("findBySlug", () => {
    it("should return the category when found", async () => {
      const category = {
        id: "category-123",
        name: "Frontend",
        slug: "frontend",
      } as CategoryEntity;

      repository.findOneBy.mockResolvedValue(category);

      await expect(service.findBySlug("frontend")).resolves.toBe(category);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        slug: "frontend",
      });
    });

    it("should throw NotFoundException when the category does not exist", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findBySlug("missing-slug")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.findOneBy.mockRejectedValue(error);

      await expect(service.findBySlug("frontend")).rejects.toThrow(error);
    });
  });

  describe("findAll", () => {
    it("should return all categories", async () => {
      const categories = [
        { id: "1", name: "Frontend", slug: "frontend" },
        { id: "2", name: "Backend", slug: "backend" },
      ] as CategoryEntity[];

      repository.find.mockResolvedValue(categories);

      await expect(service.findAll()).resolves.toBe(categories);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when no categories exist", async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.find.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });
});
