import { Test, TestingModule } from "@nestjs/testing";
import { TagService } from "./services/Tag.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { TagEntity } from "./entities/Tag.entity";
import { TagController } from "./tag.controller";

describe("TagController", () => {
  let controller: TagController;

  const mockTagService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TagController>(TagController);
  });

  describe("fetchAll", () => {
    it("should return all tags", async () => {
      const tags = [
        { id: "tag-1", name: "NestJS", slug: "nestjs" },
        { id: "tag-2", name: "TypeScript", slug: "typescript" },
      ] as TagEntity[];

      mockTagService.findAll.mockResolvedValue(tags);

      await expect(controller.fetchAll()).resolves.toBe(tags);
      expect(mockTagService.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when no tags exist", async () => {
      mockTagService.findAll.mockResolvedValue([]);

      await expect(controller.fetchAll()).resolves.toEqual([]);
    });

    it("should propagate errors from TagService", async () => {
      const error = new Error("Database error");
      mockTagService.findAll.mockRejectedValue(error);

      await expect(controller.fetchAll()).rejects.toThrow(error);
    });
  });
});
