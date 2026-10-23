import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/Auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: { authenticate: jest.Mock };

  beforeEach(async () => {
    authService = {
      authenticate: jest.fn(),
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

  describe("oAuthCallback", () => {
    const code = "github-oauth-code";
    const jwtPair = {
      access: "access-token",
      refresh: "refresh-token",
    };

    let res: { set: jest.Mock; cookie: jest.Mock };

    beforeEach(() => {
      res = {
        set: jest.fn(),
        cookie: jest.fn(),
      };
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
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        }),
      );
    });

    it("should not set response headers if authentication fails", async () => {
      authService.authenticate.mockRejectedValue(
        new InternalServerErrorException(),
      );

      await expect(controller.oAuthCallback(code, res as any)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(res.set).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it("should propagate authentication errors", async () => {
      const error = new Error("OAuth authentication failed");
      authService.authenticate.mockRejectedValue(error);

      await expect(controller.oAuthCallback(code, res as any)).rejects.toThrow(
        error,
      );
    });
  });
});
