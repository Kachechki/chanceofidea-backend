import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CategoriesSeederService } from "./CategoriesSeeder.service";
import { CategoryService } from "../../category/services/Category.sevice";

describe("CategoriesSeederService", () => {
  let service: CategoriesSeederService;
  let categoryService: { create: jest.Mock };

  const DEFAULT_CATEGORIES = [
    "All Categories",
    "Frontend",
    "Backend",
    "Fullstack",
    "Telegram bot",
    "Artificial Intelligence and Machine Learning",
    "Mobile Development",
    "Desktop Software Development",
    "Cybersecurity",
    "Game Development",
    "Design and UI/UX",
    "Other",
  ];

  beforeEach(async () => {
    categoryService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesSeederService,
        {
          provide: CategoryService,
          useValue: categoryService,
        },
      ],
    }).compile();

    service = module.get<CategoriesSeederService>(CategoriesSeederService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("onApplicationBootstrap", () => {
    it("should create every default category", async () => {
      await service.onApplicationBootstrap();

      expect(categoryService.create).toHaveBeenCalledTimes(
        DEFAULT_CATEGORIES.length,
      );

      for (const category of DEFAULT_CATEGORIES) {
        expect(categoryService.create).toHaveBeenCalledWith({
          name: category,
        });
      }
    });

    it("should create categories sequentially", async () => {
      const callOrder: string[] = [];

      categoryService.create.mockImplementation(
        async ({ name }: { name: string }) => {
          callOrder.push(name);
        },
      );

      await service.onApplicationBootstrap();

      expect(callOrder).toEqual(DEFAULT_CATEGORIES);
    });

    it("should skip categories that already exist", async () => {
      categoryService.create.mockRejectedValueOnce(
        new ConflictException("Category already exists"),
      );

      await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

      expect(categoryService.create).toHaveBeenCalledTimes(
        DEFAULT_CATEGORIES.length,
      );
    });

    it("should continue seeding after a category conflict", async () => {
      categoryService.create
        .mockRejectedValueOnce(new ConflictException())
        .mockResolvedValue(undefined);

      await service.onApplicationBootstrap();

      expect(categoryService.create).toHaveBeenCalledTimes(
        DEFAULT_CATEGORIES.length,
      );

      expect(categoryService.create).toHaveBeenLastCalledWith({
        name: DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1],
      });
    });

    it("should propagate unexpected errors", async () => {
      const error = new Error("Database connection failed");

      categoryService.create.mockRejectedValueOnce(error);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(error);

      expect(categoryService.create).toHaveBeenCalledTimes(1);
    });

    it("should stop seeding after an unexpected error", async () => {
      categoryService.create
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Unexpected error"));

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        "Unexpected error",
      );

      expect(categoryService.create).toHaveBeenCalledTimes(2);
    });
  });
});
