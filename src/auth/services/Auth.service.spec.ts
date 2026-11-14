import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import { JwtTokenService } from "./Jwt.service";
import { GithubAccessService } from "./GithubAccess.service";
import { AuthService } from "./Auth.service";
import { MailService } from "../../mail/services/Mail.service";
import { RedisService } from "../../redis/services/Redis.service";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { createHmac } from "crypto";
import { SettingsService } from "../../settings/services/Settings.service";

describe("AuthService", () => {
  let service: AuthService;

  let configService: {
    getOrThrow: jest.Mock;
  };

  let userService: {
    save: jest.Mock;
  };

  let jwtService: {
    sign: jest.Mock;
    refresh: jest.Mock;
  };

  let githubAccessService: {
    save: jest.Mock;
  };

  let mailService: {
    sendVerificationEmail: jest.Mock;
  };

  let redisService: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  let settingsService: {
    createDefault: jest.Mock;
  };

  const userId = "user-123";
  const githubAccessToken = "github-access-token";

  const profileData = {
    id: 12345,
    login: "test-user",
    avatar_url: "https://avatars.githubusercontent.com/u/12345",
  };

  const jwtPair = {
    access: "jwt-access-token",
    refresh: "jwt-refresh-token",
  };

  const originalFetch = global.fetch;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          "github.clientId": "github-client-id",
          "github.clientSecret": "github-client-secret",
          "mail.verificationSecret": "test-verification-secret",
        };

        if (!(key in values)) {
          throw new Error(`Missing config: ${key}`);
        }

        return values[key];
      }),
    };

    userService = {
      save: jest.fn().mockResolvedValue(userId),
    };

    jwtService = {
      sign: jest.fn().mockResolvedValue(jwtPair),
      refresh: jest.fn().mockResolvedValue(jwtPair),
    };

    githubAccessService = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    redisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };

    settingsService = {
      createDefault: jest.fn().mockRejectedValue(undefined),
    };

    service = new AuthService(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
      jwtService as unknown as JwtTokenService,
      githubAccessService as unknown as GithubAccessService,
      mailService as unknown as MailService,
      redisService as unknown as RedisService,
      SettingsService as unknown as SettingsService,
    );

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: githubAccessToken }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(profileData), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should exchange the OAuth code for a GitHub access token", async () => {
      await service.authenticate("oauth-code");

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          body: JSON.stringify({
            client_id: "github-client-id",
            client_secret: "github-client-secret",
            code: "oauth-code",
          }),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
    });

    it("should fetch the authenticated GitHub profile using the access token", async () => {
      await service.authenticate("oauth-code");

      const [url, options] = (global.fetch as jest.Mock).mock.calls[1];

      expect(url).toBe("https://api.github.com/user");
      expect(options.headers.authorization).toBe(`token ${githubAccessToken}`);
    });

    it("should save the user using their GitHub profile data", async () => {
      await service.authenticate("oauth-code");

      expect(userService.save).toHaveBeenCalledWith({
        avatarUrl: profileData.avatar_url,
        login: profileData.login,
        githubId: profileData.id,
      });

      expect(userService.save).toHaveBeenCalledTimes(1);
    });

    it("should save the GitHub access token for the saved user", async () => {
      await service.authenticate("oauth-code");

      expect(githubAccessService.save).toHaveBeenCalledWith({
        accessToken: githubAccessToken,
        userId,
      });

      expect(githubAccessService.save).toHaveBeenCalledTimes(1);
    });

    it("should sign a JWT pair using the saved user's ID", async () => {
      await service.authenticate("oauth-code");

      expect(jwtService.sign).toHaveBeenCalledWith({
        id: userId,
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
    });

    it("should return the JWT pair", async () => {
      await expect(service.authenticate("oauth-code")).resolves.toEqual(
        jwtPair,
      );
    });

    it("should save the user and GitHub token before signing JWTs", async () => {
      const callOrder: string[] = [];

      userService.save.mockImplementation(async () => {
        callOrder.push("user");
        return userId;
      });

      githubAccessService.save.mockImplementation(async () => {
        callOrder.push("github-token");
      });

      jwtService.sign.mockImplementation(async () => {
        callOrder.push("jwt");
        return jwtPair;
      });

      await service.authenticate("oauth-code");

      expect(callOrder).toEqual(["user", "github-token", "jwt"]);
    });

    it("should propagate an error if saving the user fails", async () => {
      const error = new Error("Database error");
      userService.save.mockRejectedValue(error);

      await expect(service.authenticate("oauth-code")).rejects.toThrow(
        "Database error",
      );

      expect(githubAccessService.save).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should propagate an error if saving the GitHub token fails", async () => {
      githubAccessService.save.mockRejectedValue(
        new Error("Token storage failed"),
      );

      await expect(service.authenticate("oauth-code")).rejects.toThrow(
        "Token storage failed",
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should propagate an error if signing JWTs fails", async () => {
      jwtService.sign.mockRejectedValue(new Error("JWT signing failed"));

      await expect(service.authenticate("oauth-code")).rejects.toThrow(
        "JWT signing failed",
      );
    });
  });

  describe("refresh", () => {
    const refreshToken = "refresh-token";

    it("should delegate token refresh to JwtTokenService", async () => {
      await service.refresh(refreshToken);

      expect(jwtService.refresh).toHaveBeenCalledTimes(1);
      expect(jwtService.refresh).toHaveBeenCalledWith(refreshToken);
    });

    it("should return the JWT pair", async () => {
      await expect(service.refresh(refreshToken)).resolves.toEqual(jwtPair);
    });

    it("should propagate errors from JwtTokenService", async () => {
      const error = new UnauthorizedException("Invalid refresh token");
      jwtService.refresh.mockRejectedValue(error);

      await expect(service.refresh(refreshToken)).rejects.toThrow(error);
    });
  });

  describe("startEmailAuth", () => {
    const email = "test@example.com";
    const verificationSecret = "test-verification-secret";

    it("should generate a six-digit verification code", async () => {
      await service.startEmailAuth(email);

      // The method receives one object, not two arguments.
      const sentEmail = mailService.sendVerificationEmail.mock.calls[0][0];

      expect(sentEmail.code).toMatch(/^\d{6}$/);
    });

    it("should store the HMAC of the verification code in Redis", async () => {
      await service.startEmailAuth(email);

      const sentEmail = mailService.sendVerificationEmail.mock.calls[0][0];

      const expectedHmac = createHmac("sha256", verificationSecret)
        .update(sentEmail.code)
        .digest("hex");

      expect(redisService.set).toHaveBeenCalledTimes(1);
      expect(redisService.set).toHaveBeenCalledWith(
        `email-verification:${email}`,
        expectedHmac,
        300,
      );
    });

    it("should send the verification code to the provided email", async () => {
      await service.startEmailAuth(email);

      const sentEmail = mailService.sendVerificationEmail.mock.calls[0][0];

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(sentEmail.to).toBe(email);
      expect(sentEmail.code).toMatch(/^\d{6}$/);
    });

    it("should store the code before sending the email", async () => {
      const callOrder: string[] = [];

      redisService.set.mockImplementation(async () => {
        callOrder.push("redis");
      });

      mailService.sendVerificationEmail.mockImplementation(async () => {
        callOrder.push("mail");
      });

      await service.startEmailAuth(email);

      expect(callOrder).toEqual(["redis", "mail"]);
    });

    it("should propagate Redis errors", async () => {
      redisService.set.mockRejectedValue(new Error("Redis unavailable"));

      await expect(service.startEmailAuth(email)).rejects.toThrow(
        "Redis unavailable",
      );

      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("should propagate email delivery errors", async () => {
      mailService.sendVerificationEmail.mockRejectedValue(
        new Error("SMTP unavailable"),
      );

      await expect(service.startEmailAuth(email)).rejects.toThrow(
        "SMTP unavailable",
      );
    });
  });

  describe("finishEmailAuth", () => {
    const email = "test@example.com";
    const code = "123456";
    const verificationSecret = "test-verification-secret";

    const storedHmac = createHmac("sha256", verificationSecret)
      .update(code)
      .digest("hex");

    const authData = {
      email,
      code,
    };

    beforeEach(() => {
      redisService.get.mockResolvedValue(storedHmac);
    });

    it("should retrieve the stored verification HMAC from Redis", async () => {
      await service.finishEmailAuth(authData);

      expect(redisService.get).toHaveBeenCalledTimes(1);
      expect(redisService.get).toHaveBeenCalledWith(
        `email-verification:${email}`,
      );
    });

    it("should throw BadRequestException if the code has expired", async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.finishEmailAuth(authData)).rejects.toThrow(
        BadRequestException,
      );

      expect(userService.save).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the code is incorrect", async () => {
      const incorrectCode = "654321";

      await expect(
        service.finishEmailAuth({
          email,
          code: incorrectCode,
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.save).not.toHaveBeenCalled();
      expect(redisService.del).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should create a user using the verified email", async () => {
      await service.finishEmailAuth(authData);

      expect(userService.save).toHaveBeenCalledTimes(1);
      expect(userService.save).toHaveBeenCalledWith({ email });
    });

    it("should delete the verification code after successful verification", async () => {
      await service.finishEmailAuth(authData);

      expect(redisService.del).toHaveBeenCalledTimes(1);
      expect(redisService.del).toHaveBeenCalledWith(
        `email-verification:${email}`,
      );
    });

    it("should sign JWTs using the created user's ID", async () => {
      await service.finishEmailAuth(authData);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: userId,
      });
    });

    it("should return the JWT pair", async () => {
      await expect(service.finishEmailAuth(authData)).resolves.toEqual(jwtPair);
    });

    it("should perform operations in the correct order", async () => {
      const callOrder: string[] = [];

      redisService.get.mockImplementation(async () => {
        callOrder.push("redis-get");
        return storedHmac;
      });

      userService.save.mockImplementation(async () => {
        callOrder.push("user-save");
        return userId;
      });

      redisService.del.mockImplementation(async () => {
        callOrder.push("redis-delete");
      });

      jwtService.sign.mockImplementation(async () => {
        callOrder.push("jwt-sign");
        return jwtPair;
      });

      await service.finishEmailAuth(authData);

      expect(callOrder).toEqual([
        "redis-get",
        "user-save",
        "redis-delete",
        "jwt-sign",
      ]);
    });

    it("should propagate errors if user creation fails", async () => {
      userService.save.mockRejectedValue(new Error("Database error"));

      await expect(service.finishEmailAuth(authData)).rejects.toThrow(
        "Database error",
      );

      expect(redisService.del).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should propagate errors if Redis deletion fails", async () => {
      redisService.del.mockRejectedValue(new Error("Redis deletion failed"));

      await expect(service.finishEmailAuth(authData)).rejects.toThrow(
        "Redis deletion failed",
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("should propagate errors if JWT signing fails", async () => {
      jwtService.sign.mockRejectedValue(new Error("JWT signing failed"));

      await expect(service.finishEmailAuth(authData)).rejects.toThrow(
        "JWT signing failed",
      );
    });
  });
});
