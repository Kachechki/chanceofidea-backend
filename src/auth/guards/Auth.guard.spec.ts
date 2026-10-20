import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./Auth.guard";
import { JwtTokenService } from "../services/Jwt.service";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let jwtService: {
    validateAccess: jest.Mock;
    validateRefresh: jest.Mock;
    refresh: jest.Mock;
  };

  let req: any;
  let res: any;
  let context: ExecutionContext;

  const payload = {
    id: "user-123",
    login: "test-user",
  };

  beforeEach(() => {
    jwtService = {
      validateAccess: jest.fn(),
      validateRefresh: jest.fn(),
      refresh: jest.fn(),
    };

    guard = new AuthGuard(jwtService as unknown as JwtTokenService);

    req = {
      headers: {},
      cookies: {},
      user: undefined,
    };

    res = {
      setHeader: jest.fn(),
    };

    context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should throw UnauthorizedException when no tokens are provided", async () => {
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.validateAccess).not.toHaveBeenCalled();
      expect(jwtService.validateRefresh).not.toHaveBeenCalled();
      expect(jwtService.refresh).not.toHaveBeenCalled();
    });

    it("should authenticate using a valid access token", async () => {
      req.headers.authorization = "Bearer access-token";
      jwtService.validateAccess.mockReturnValue(payload);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(jwtService.validateAccess).toHaveBeenCalledWith("access-token");
      expect(req.user).toEqual(payload);
      expect(jwtService.validateRefresh).not.toHaveBeenCalled();
      expect(jwtService.refresh).not.toHaveBeenCalled();
    });

    it("should reject an invalid access token", async () => {
      req.headers.authorization = "Bearer invalid-token";
      jwtService.validateAccess.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(req.user).toBeUndefined();
    });

    it("should reject a malformed Authorization header", async () => {
      req.headers.authorization = "Basic access-token";

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.validateAccess).not.toHaveBeenCalled();
    });

    it("should authenticate using a refresh token and issue a new access token", async () => {
      req.cookies.refresh = "refresh-token";

      jwtService.validateRefresh.mockReturnValue(payload);
      jwtService.refresh.mockResolvedValue({
        access: "new-access-token",
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(jwtService.validateRefresh).toHaveBeenCalledWith("refresh-token");
      expect(jwtService.refresh).toHaveBeenCalledWith("refresh-token");

      expect(res.setHeader).toHaveBeenCalledWith(
        "x-access-token",
        "new-access-token",
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "x-refresh-token",
        "refresh-token",
      );

      expect(req.user).toEqual(payload);
    });

    it("should reject an invalid refresh token", async () => {
      req.cookies.refresh = "invalid-refresh-token";

      jwtService.validateRefresh.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.refresh).not.toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it("should return false when both access and refresh tokens are present", async () => {
      req.headers.authorization = "Bearer access-token";
      req.cookies.refresh = "refresh-token";

      await expect(guard.canActivate(context)).resolves.toBe(false);

      expect(jwtService.validateAccess).not.toHaveBeenCalled();
      expect(jwtService.validateRefresh).not.toHaveBeenCalled();
      expect(jwtService.refresh).not.toHaveBeenCalled();
    });

    it("should reject an empty Bearer token when no refresh token exists", async () => {
      req.headers.authorization = "Bearer ";

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.validateAccess).not.toHaveBeenCalled();
    });
  });
});
