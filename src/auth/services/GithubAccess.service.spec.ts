import { UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";
import { GithubAccessEntity } from "../entities/GithubAccess.entity";
import { UserService } from "../../user/services/User.service";
import { EncryptionService } from "./Encryption.service";
import { GithubAccessService } from "./GithubAccess.service";

describe("GithubAccessService", () => {
  let service: GithubAccessService;

  let repository: {
    save: jest.Mock;
    findOneBy: jest.Mock;
  };

  let userService: {
    findById: jest.Mock;
  };

  let encryptionService: {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
  };

  const userId = "user-123";
  const accessToken = "github-access-token";
  const encryptedToken = "encrypted-token";

  const user = {
    id: userId,
    login: "test-user",
  } as UserEntity;

  beforeEach(() => {
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findOneBy: jest.fn(),
    };

    userService = {
      findById: jest.fn().mockResolvedValue(user),
    };

    encryptionService = {
      encrypt: jest.fn().mockReturnValue(encryptedToken),
      decrypt: jest.fn().mockReturnValue(accessToken),
    };

    service = new GithubAccessService(
      repository as unknown as Repository<GithubAccessEntity>,
      userService as unknown as UserService,
      encryptionService as unknown as EncryptionService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("should find the user by ID", async () => {
      await service.save({ accessToken, userId });

      expect(userService.findById).toHaveBeenCalledWith(userId, {
        githubAccessToken: true,
      });
      expect(userService.findById).toHaveBeenCalledTimes(1);
    });

    it("should encrypt the access token before saving it", async () => {
      await service.save({ accessToken, userId });

      expect(encryptionService.encrypt).toHaveBeenCalledWith(accessToken);

      expect(repository.save).toHaveBeenCalledWith({
        githubAccessToken: encryptedToken,
        user,
      });
    });

    it("should save the encrypted token associated with the correct user", async () => {
      await service.save({ accessToken, userId });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          githubAccessToken: encryptedToken,
        }),
      );
    });

    it("should not encrypt or save a token if finding the user fails", async () => {
      userService.findById.mockRejectedValue(new Error("User not found"));

      await expect(service.save({ accessToken, userId })).rejects.toThrow(
        "User not found",
      );

      expect(encryptionService.encrypt).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate encryption errors", async () => {
      encryptionService.encrypt.mockImplementation(() => {
        throw new Error("Encryption failed");
      });

      await expect(service.save({ accessToken, userId })).rejects.toThrow(
        "Encryption failed",
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate repository save errors", async () => {
      repository.save.mockRejectedValue(new Error("Database error"));

      await expect(service.save({ accessToken, userId })).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("get", () => {
    it("should find the token associated with the supplied user", async () => {
      repository.findOneBy.mockResolvedValue({
        githubAccessToken: encryptedToken,
        user,
      });

      await service.get(user);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        user: { id: user.id },
      });
      expect(repository.findOneBy).toHaveBeenCalledTimes(1);
    });

    it("should decrypt and return the stored access token", async () => {
      repository.findOneBy.mockResolvedValue({
        githubAccessToken: encryptedToken,
        user,
      });

      await expect(service.get(user)).resolves.toBe(accessToken);

      expect(encryptionService.decrypt).toHaveBeenCalledWith(encryptedToken);
    });

    it("should throw UnauthorizedException if no token exists", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.get(user)).rejects.toThrow(
        new UnauthorizedException("No github access token"),
      );

      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });

    it("should propagate repository errors", async () => {
      repository.findOneBy.mockRejectedValue(new Error("Database error"));

      await expect(service.get(user)).rejects.toThrow("Database error");

      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });

    it("should propagate decryption errors", async () => {
      repository.findOneBy.mockResolvedValue({
        githubAccessToken: encryptedToken,
        user,
      });

      encryptionService.decrypt.mockImplementation(() => {
        throw new Error("Could not decrypt GitHub token");
      });

      await expect(service.get(user)).rejects.toThrow(
        "Could not decrypt GitHub token",
      );
    });
  });
});
