import { Test, TestingModule } from "@nestjs/testing";
import { CategoryService } from "./services/Category.sevice";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { CategoryController } from "./category.controller";

describe("CategoryController", () => {
  let controller: CategoryController;
  let categoryService: { findAll: jest.Mock };

  beforeEach(async () => {
    categoryService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: categoryService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchAll", () => {
    it("should return all categories", async () => {
      const categories = [
        { id: "1", name: "Frontend", slug: "frontend" },
        { id: "2", name: "Backend", slug: "backend" },
      ];

      categoryService.findAll.mockResolvedValue(categories);

      await expect(controller.fetchAll()).resolves.toBe(categories);

      expect(categoryService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when no categories exist", async () => {
      categoryService.findAll.mockResolvedValue([]);

      await expect(controller.fetchAll()).resolves.toEqual([]);
    });

    it("should propagate errors from CategoryService", async () => {
      const error = new Error("Database error");
      categoryService.findAll.mockRejectedValue(error);

      await expect(controller.fetchAll()).rejects.toThrow(error);
    });
  });
});
