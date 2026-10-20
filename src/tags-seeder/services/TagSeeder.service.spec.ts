import { ConflictException } from "@nestjs/common";
import { TagService } from "../../tag/services/Tag.service";
import { TagsSeederService } from "./TagsSeeder.service";

describe("TagsSeederService", () => {
  let service: TagsSeederService;
  let tagService: { create: jest.Mock };
  let loggerLogSpy: jest.SpyInstance;

  const DEFAULT_TAGS = [
    "Python",
    "Java",
    "Rust",
    "Go",
    "TypeScript",
    "JavaScript",
    "Web",
    "C++",
    "C",
    "PHP",
    "C#",
    "React",
    "Vue.js",
    "Node.js",
    "Next.js",
    "FastAPI",
    "Flask",
    "DJango",
    "Docker",
    "NestJS",
  ];

  beforeEach(() => {
    tagService = {
      create: jest.fn().mockResolvedValue("tag-id"),
    };

    service = new TagsSeederService(tagService as unknown as TagService);

    loggerLogSpy = jest
      .spyOn((service as any).logger, "log")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("onApplicationBootstrap", () => {
    it("should create every default tag", async () => {
      await service.onApplicationBootstrap();

      expect(tagService.create).toHaveBeenCalledTimes(DEFAULT_TAGS.length);

      for (const tag of DEFAULT_TAGS) {
        expect(tagService.create).toHaveBeenCalledWith({ name: tag });
      }
    });

    it("should log when a tag is created", async () => {
      await service.onApplicationBootstrap();

      expect(loggerLogSpy).toHaveBeenCalledWith("Created tag Python");
      expect(loggerLogSpy).toHaveBeenCalledWith("Created tag NestJS");
    });

    it("should skip existing tags and continue seeding", async () => {
      tagService.create
        .mockRejectedValueOnce(new ConflictException("Tag exists"))
        .mockResolvedValueOnce("tag-id");

      await service.onApplicationBootstrap();

      expect(tagService.create).toHaveBeenCalledTimes(DEFAULT_TAGS.length);
      expect(loggerLogSpy).toHaveBeenCalledWith("Skipped tag Python");
      expect(loggerLogSpy).toHaveBeenCalledWith("Created tag Java");
    });

    it("should continue seeding when multiple tags already exist", async () => {
      tagService.create
        .mockRejectedValueOnce(new ConflictException("Tag exists"))
        .mockRejectedValueOnce(new ConflictException("Tag exists"))
        .mockResolvedValue("tag-id");

      await service.onApplicationBootstrap();

      expect(tagService.create).toHaveBeenCalledTimes(DEFAULT_TAGS.length);
      expect(loggerLogSpy).toHaveBeenCalledWith("Skipped tag Python");
      expect(loggerLogSpy).toHaveBeenCalledWith("Skipped tag Java");
      expect(loggerLogSpy).toHaveBeenCalledWith("Created tag Rust");
    });

    it("should stop and rethrow unexpected errors", async () => {
      const error = new Error("Database connection failed");

      tagService.create
        .mockResolvedValueOnce("tag-id")
        .mockRejectedValueOnce(error);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(error);

      expect(tagService.create).toHaveBeenCalledTimes(2);
      expect(loggerLogSpy).toHaveBeenCalledWith("Created tag Python");
    });

    it("should rethrow unexpected errors even if they occur on the first tag", async () => {
      const error = new Error("Database connection failed");
      tagService.create.mockRejectedValueOnce(error);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(error);

      expect(tagService.create).toHaveBeenCalledTimes(1);
    });
  });
});
