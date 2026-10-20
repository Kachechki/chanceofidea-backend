import { ConflictException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TagEntity } from "../entities/Tag.entity";
import { TagService } from "./Tag.service";

type MockRepository = {
  findOneBy: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
};

describe("TagService", () => {
  let service!: TagService;
  let repository!: MockRepository;

  beforeEach(() => {
    repository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    service = new TagService(repository as any);
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const data = { name: "  NestJS Backend  " };

    it("should normalize the name into a slug and create the tag", async () => {
      repository.findOneBy!.mockResolvedValue(null);
      repository.save!.mockResolvedValue({
        id: "tag-1",
        name: data.name,
        slug: "nestjs-backend",
      } as TagEntity);

      const result = await service.create(data);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        slug: "nestjs-backend",
      });
      expect(repository.save).toHaveBeenCalledWith({
        name: data.name,
        slug: "nestjs-backend",
      });
      expect(result).toBe("tag-1");
    });

    it("should throw ConflictException if the tag already exists", async () => {
      repository.findOneBy!.mockResolvedValue({
        id: "tag-1",
        name: "NestJS Backend",
        slug: "nestjs-backend",
      } as TagEntity);

      await expect(service.create(data)).rejects.toThrow(
        new ConflictException("Tag exists"),
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository errors when checking for an existing tag", async () => {
      const error = new Error("Database error");
      repository.findOneBy!.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow(error);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository errors when saving the tag", async () => {
      repository.findOneBy!.mockResolvedValue(null);

      const error = new Error("Database error");
      repository.save!.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow(error);
    });
  });

  describe("findById", () => {
    it("should return the tag when it exists", async () => {
      const tag = {
        id: "tag-1",
        name: "NestJS",
        slug: "nestjs",
      } as TagEntity;

      repository.findOneBy!.mockResolvedValue(tag);

      await expect(service.findById("tag-1")).resolves.toBe(tag);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: "tag-1" });
    });

    it("should throw NotFoundException when the tag does not exist", async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.findById("missing-id")).rejects.toThrow(
        new NotFoundException("Tag not found"),
      );
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.findOneBy!.mockRejectedValue(error);

      await expect(service.findById("tag-1")).rejects.toThrow(error);
    });
  });

  describe("findBySlug", () => {
    it("should return the tag when it exists", async () => {
      const tag = {
        id: "tag-1",
        name: "NestJS",
        slug: "nestjs",
      } as TagEntity;

      repository.findOneBy!.mockResolvedValue(tag);

      await expect(service.findBySlug("nestjs")).resolves.toBe(tag);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        slug: "nestjs",
      });
    });

    it("should throw NotFoundException when the tag does not exist", async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.findBySlug("missing-tag")).rejects.toThrow(
        new NotFoundException("Tag not found"),
      );
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.findOneBy!.mockRejectedValue(error);

      await expect(service.findBySlug("nestjs")).rejects.toThrow(error);
    });
  });

  describe("findAll", () => {
    it("should return all tags", async () => {
      const tags = [
        { id: "tag-1", name: "NestJS", slug: "nestjs" },
        { id: "tag-2", name: "TypeScript", slug: "typescript" },
      ] as TagEntity[];

      repository.find!.mockResolvedValue(tags);

      await expect(service.findAll()).resolves.toBe(tags);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array when no tags exist", async () => {
      repository.find!.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.find!.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });
});
