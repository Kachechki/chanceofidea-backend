import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import { JwtTokenService } from "./Jwt.service";
import { GithubAccessService } from "./GithubAccess.service";
import { AuthService } from "./Auth.service";

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
  };

  let githubAccessService: {
    save: jest.Mock;
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
    };

    githubAccessService = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
      jwtService as unknown as JwtTokenService,
      githubAccessService as unknown as GithubAccessService,
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

      expect(githubAccessService.save).toHaveBeenCalledWith(
        githubAccessToken,
        userId,
      );

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
});
