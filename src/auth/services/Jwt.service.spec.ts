import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import { JwtTokenService } from "./Jwt.service";

describe("JwtTokenService", () => {
  let service: JwtTokenService;

  let jwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };

  let userService: {
    findById: jest.Mock;
  };

  let configService: {
    getOrThrow: jest.Mock;
  };

  const accessSecret = "test-access-secret";
  const refreshSecret = "test-refresh-secret";

  const payload = { id: "user-123" };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    userService = {
      findById: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          "jwt.accessSecret": accessSecret,
          "jwt.refreshSecret": refreshSecret,
        };

        if (!(key in values)) {
          throw new Error(`Missing config: ${key}`);
        }

        return values[key];
      }),
    };

    service = new JwtTokenService(
      jwtService as unknown as JwtService,
      userService as unknown as UserService,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should load both JWT secrets from configuration", () => {
      expect(configService.getOrThrow).toHaveBeenNthCalledWith(
        1,
        "jwt.accessSecret",
      );

      expect(configService.getOrThrow).toHaveBeenNthCalledWith(
        2,
        "jwt.refreshSecret",
      );
    });
  });

  describe("sign", () => {
    it("should sign access and refresh tokens with their respective secrets and expirations", () => {
      jwtService.sign
        .mockReturnValueOnce("signed-access-token")
        .mockReturnValueOnce("signed-refresh-token");

      const result = service.sign(payload);

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, payload, {
        expiresIn: "15m",
        secret: accessSecret,
      });

      expect(jwtService.sign).toHaveBeenNthCalledWith(2, payload, {
        expiresIn: "5d",
        secret: refreshSecret,
      });

      expect(result).toEqual({
        access: "signed-access-token",
        refresh: "signed-refresh-token",
      });
    });
  });

  describe("validateAccess", () => {
    it("should verify the access token using the access secret", () => {
      jwtService.verify.mockReturnValue(payload);

      expect(service.validateAccess("access-token")).toEqual(payload);

      expect(jwtService.verify).toHaveBeenCalledWith("access-token", {
        secret: accessSecret,
      });
    });

    it("should throw UnauthorizedException when access token verification fails", () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => service.validateAccess("invalid-token")).toThrow(
        new UnauthorizedException("Token has been expired or revoked."),
      );
    });
  });

  describe("validateRefresh", () => {
    it("should verify the refresh token using the refresh secret", () => {
      jwtService.verify.mockReturnValue(payload);

      expect(service.validateRefresh("refresh-token")).toEqual(payload);

      expect(jwtService.verify).toHaveBeenCalledWith("refresh-token", {
        secret: refreshSecret,
      });
    });

    it("should throw UnauthorizedException when refresh token verification fails", () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => service.validateRefresh("invalid-token")).toThrow(
        new UnauthorizedException("Token has been expired or revoked."),
      );
    });
  });

  describe("refresh", () => {
    it("should validate the refresh token, find the user, and issue a new pair", async () => {
      const updatedUser = { id: "user-123" };

      jwtService.verify.mockReturnValue(payload);
      userService.findById.mockResolvedValue(updatedUser);

      jwtService.sign
        .mockReturnValueOnce("new-access-token")
        .mockReturnValueOnce("new-refresh-token");

      const result = await service.refresh("refresh-token");

      expect(jwtService.verify).toHaveBeenCalledWith("refresh-token", {
        secret: refreshSecret,
      });

      expect(userService.findById).toHaveBeenCalledWith("user-123");

      expect(result).toEqual({
        access: "new-access-token",
        refresh: "new-refresh-token",
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { id: updatedUser.id },
        { expiresIn: "15m", secret: accessSecret },
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { id: updatedUser.id },
        { expiresIn: "5d", secret: refreshSecret },
      );
    });

    it("should throw UnauthorizedException when refresh token validation fails", async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(service.refresh("invalid-token")).rejects.toThrow(
        UnauthorizedException,
      );

      expect(userService.findById).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should reject when the user does not exist", async () => {
      jwtService.verify.mockReturnValue(payload);
      userService.findById.mockResolvedValue(null);

      await expect(service.refresh("refresh-token")).rejects.toThrow(
        new UnauthorizedException("Invalid refresh token"),
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should propagate errors from user lookup", async () => {
      jwtService.verify.mockReturnValue(payload);
      userService.findById.mockRejectedValue(new Error("Database error"));

      await expect(service.refresh("refresh-token")).rejects.toThrow(
        "Database error",
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
