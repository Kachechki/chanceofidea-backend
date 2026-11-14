import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/Auth.service";

describe("AuthController", () => {
  let controller: AuthController;

  let authService: {
    authenticate: jest.Mock;
    refresh: jest.Mock;
    startEmailAuth: jest.Mock;
    finishEmailAuth: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      authenticate: jest.fn(),
      refresh: jest.fn(),
      startEmailAuth: jest.fn(),
      finishEmailAuth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const jwtPair = {
    access: "access-token",
    refresh: "refresh-token",
  };

  const createResponse = () => ({
    set: jest.fn(),
    cookie: jest.fn(),
  });

  const expectedCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  };

  describe("oAuthCallback", () => {
    const code = "github-oauth-code";

    let res: ReturnType<typeof createResponse>;

    beforeEach(() => {
      res = createResponse();
    });

    it("should authenticate using the OAuth code", async () => {
      authService.authenticate.mockResolvedValue(jwtPair);

      await controller.oAuthCallback(code, res as any);

      expect(authService.authenticate).toHaveBeenCalledTimes(1);
      expect(authService.authenticate).toHaveBeenCalledWith(code);
    });

    it("should set the access token header and refresh token cookie", async () => {
      authService.authenticate.mockResolvedValue(jwtPair);

      await controller.oAuthCallback(code, res as any);

      expect(res.set).toHaveBeenCalledWith({
        "x-access-token": jwtPair.access,
      });

      expect(res.cookie).toHaveBeenCalledWith(
        "refresh",
        jwtPair.refresh,
        expect.objectContaining(expectedCookieOptions),
      );
    });

    it("should not modify the response if authentication fails", async () => {
      authService.authenticate.mockRejectedValue(
        new InternalServerErrorException(),
      );

      await expect(controller.oAuthCallback(code, res as any)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(res.set).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    let req: { get: jest.Mock };
    let res: ReturnType<typeof createResponse>;

    beforeEach(() => {
      req = {
        get: jest.fn(),
      };

      res = createResponse();
    });

    it("should throw BadRequestException if no refresh token is provided", async () => {
      req.get.mockReturnValue(undefined);

      await expect(controller.refresh(req as any, res as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(authService.refresh).not.toHaveBeenCalled();
      expect(res.set).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it("should refresh tokens using the provided refresh token", async () => {
      req.get.mockReturnValue(jwtPair.refresh);
      authService.refresh.mockResolvedValue(jwtPair);

      await controller.refresh(req as any, res as any);

      expect(authService.refresh).toHaveBeenCalledTimes(1);
      expect(authService.refresh).toHaveBeenCalledWith(jwtPair.refresh);
    });

    it("should set the new access token and refresh cookie", async () => {
      req.get.mockReturnValue(jwtPair.refresh);
      authService.refresh.mockResolvedValue(jwtPair);

      await controller.refresh(req as any, res as any);

      expect(res.set).toHaveBeenCalledWith({
        "x-access-token": jwtPair.access,
      });

      expect(res.cookie).toHaveBeenCalledWith(
        "refresh",
        jwtPair.refresh,
        expect.objectContaining(expectedCookieOptions),
      );
    });

    it("should not modify the response if refreshing fails", async () => {
      req.get.mockReturnValue(jwtPair.refresh);

      authService.refresh.mockRejectedValue(new InternalServerErrorException());

      await expect(controller.refresh(req as any, res as any)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(res.set).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe("startEmailAuth", () => {
    const email = "test@example.com";

    it("should start email authentication", async () => {
      authService.startEmailAuth.mockResolvedValue(undefined);

      await controller.startEmailAuth({ email });

      expect(authService.startEmailAuth).toHaveBeenCalledTimes(1);
      expect(authService.startEmailAuth).toHaveBeenCalledWith(email);
    });

    it("should propagate errors from AuthService", async () => {
      const error = new InternalServerErrorException();

      authService.startEmailAuth.mockRejectedValue(error);

      await expect(controller.startEmailAuth({ email })).rejects.toThrow(error);
    });
  });

  describe("finishEmailAuth", () => {
    const dto = {
      email: "test@example.com",
      code: 123456,
    };

    let res: ReturnType<typeof createResponse>;

    beforeEach(() => {
      res = createResponse();
    });

    it("should finish email authentication using the provided email and code", async () => {
      authService.finishEmailAuth.mockResolvedValue(jwtPair);

      await controller.finishEmailAuth(dto, res as any);

      expect(authService.finishEmailAuth).toHaveBeenCalledTimes(1);
      expect(authService.finishEmailAuth).toHaveBeenCalledWith({
        email: dto.email,
        code: String(dto.code),
      });
    });

    it("should set the access token header and refresh cookie", async () => {
      authService.finishEmailAuth.mockResolvedValue(jwtPair);

      await controller.finishEmailAuth(dto, res as any);

      expect(res.set).toHaveBeenCalledWith({
        "x-access-token": jwtPair.access,
      });

      expect(res.cookie).toHaveBeenCalledWith(
        "refresh",
        jwtPair.refresh,
        expect.objectContaining(expectedCookieOptions),
      );
    });

    it("should propagate authentication errors", async () => {
      const error = new BadRequestException("Invalid verification code");

      authService.finishEmailAuth.mockRejectedValue(error);

      await expect(controller.finishEmailAuth(dto, res as any)).rejects.toThrow(
        error,
      );

      expect(res.set).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
