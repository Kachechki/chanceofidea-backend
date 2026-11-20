import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { UserService } from "./User.service";
import { UserEntity } from "../entities/User.entity";
import { ISaveUser } from "../../types/SaveUser.interface";
import { ConfigService } from "@nestjs/config";
import { JwtTokenService } from "../../auth/services/Jwt.service";

describe("UserService", () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn() },
        },
        {
          provide: JwtTokenService,
          useValue: { sign: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    const userData: ISaveUser = {
      githubId: 12345,
      login: "test-user",
      avatarUrl: "https://example.com/avatar.png",
      bio: "Backend developer",
    };

    it("should create a new user if one does not exist", async () => {
      const savedUser = { id: "user-123" };

      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockResolvedValue(savedUser as UserEntity);

      const result = await service.save(userData);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        githubId: userData.githubId,
      });

      expect(repository.save).toHaveBeenCalledWith({
        id: undefined,
        githubId: userData.githubId,
        login: userData.login,
        avatarUrl: userData.avatarUrl,
        bio: userData.bio,
        updatedAt: expect.any(Date),
      });

      expect(result).toBe(savedUser.id);
    });

    it("should update an existing user instead of creating a duplicate", async () => {
      const existingUser = {
        id: "existing-user-123",
        githubId: userData.githubId,
      };

      repository.findOneBy.mockResolvedValue(existingUser as UserEntity);
      repository.save.mockResolvedValue({
        id: existingUser.id,
      } as UserEntity);

      const result = await service.save(userData);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingUser.id,
          githubId: userData.githubId,
          login: userData.login,
          avatarUrl: userData.avatarUrl,
          bio: userData.bio,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );

      expect(result).toBe(existingUser.id);
    });

    it("should set bio to undefined when it is omitted", async () => {
      const data = {
        githubId: 67890,
        login: "another-user",
        avatarUrl: "https://example.com/another.png",
      } as ISaveUser;

      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockResolvedValue({
        id: "user-456",
      } as UserEntity);

      await service.save(data);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: undefined,
        }),
      );
    });

    it("should propagate errors if finding the existing user fails", async () => {
      const error = new Error("Database error");
      repository.findOneBy.mockRejectedValue(error);

      await expect(service.save(userData)).rejects.toThrow(error);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate errors if saving the user fails", async () => {
      const error = new Error("Failed to save user");

      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockRejectedValue(error);

      await expect(service.save(userData)).rejects.toThrow(error);
    });
  });

  describe("findById", () => {
    it("should return the user when found", async () => {
      const user = {
        id: "user-123",
        githubId: 12345,
        login: "test-user",
      } as UserEntity;

      repository.findOne.mockResolvedValue(user);

      const result = await service.findById(user.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
        relations: undefined,
      });

      expect(result).toBe(user);
    });

    it("should pass the requested relations to the repository", async () => {
      const user = {
        id: "user-123",
        login: "test-user",
      } as UserEntity;

      const relations = {
        projects: true,
      };

      repository.findOne.mockResolvedValue(user);

      const result = await service.findById(user.id, relations);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
        relations,
      });

      expect(result).toBe(user);
    });

    it("should throw NotFoundException when the user does not exist", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById("missing-user")).rejects.toThrow(
        new NotFoundException("User not found"),
      );
    });

    it("should propagate errors from the repository", async () => {
      const error = new Error("Database error");
      repository.findOne.mockRejectedValue(error);

      await expect(service.findById("user-123")).rejects.toThrow(error);
    });
  });
  describe("passOnboarding", () => {
    const userId = "user-123";

    it("should mark the user's onboarding as passed", async () => {
      const user = {
        id: userId,
        onboardingPassed: false,
      } as UserEntity;

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue({
        ...user,
        onboardingPassed: true,
      } as UserEntity);

      await service.passOnboarding(userId);

      expect(user.onboardingPassed).toBe(true);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          onboardingPassed: true,
        }),
      );
    });

    it("should find the user by ID before updating onboarding", async () => {
      const user = {
        id: userId,
        onboardingPassed: false,
      } as UserEntity;

      repository.findOne.mockResolvedValue(user);
      repository.save.mockResolvedValue(user);

      await service.passOnboarding(userId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: undefined,
      });
    });

    it("should throw NotFoundException if the user does not exist", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.passOnboarding(userId)).rejects.toThrow(
        new NotFoundException("User not found"),
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate errors if saving the updated user fails", async () => {
      const user = {
        id: userId,
        onboardingPassed: false,
      } as UserEntity;

      const error = new Error("Database error");

      repository.findOne.mockResolvedValue(user);
      repository.save.mockRejectedValue(error);

      await expect(service.passOnboarding(userId)).rejects.toThrow(error);

      expect(user.onboardingPassed).toBe(true);
    });
  });
});
