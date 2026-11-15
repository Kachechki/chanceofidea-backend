import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./services/User.service";
import { UserEntity } from "./entities/User.entity";
import { UserController } from "./user.controller";
import { AuthGuard } from "../auth/guards/Auth.guard"; // Adjust this import path

describe("UserController", () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
            passOnboarding: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("me", () => {
    const userId = "user-123";

    const user = {
      id: userId,
      bio: "Backend developer",
      login: "test-user",
      createdAt: new Date("2026-01-01T12:00:00.000Z"),
      avatarUrl: "https://example.com/avatar.png",
      email: "test@example.com",
      projects: [
        {
          id: "project-123",
          title: "Test project",
        },
      ],
      settings: {
        id: "settings-123",
        prefferedLocale: "EN",
        theme: "LIGHT",
      },
      githubId: 12345,
    } as unknown as UserEntity;

    const req = {
      user: {
        id: userId,
      },
    } as any;

    it("should return the authenticated user's profile", async () => {
      userService.findById.mockResolvedValue(user);

      const result = await controller.me(req);

      expect(result).toEqual({
        id: user.id,
        bio: user.bio,
        login: user.login,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
        projects: user.projects,
        email: user.email,
        settings: user.settings,
      });
    });

    it("should find the user by the authenticated user's ID and load projects", async () => {
      userService.findById.mockResolvedValue(user);

      await controller.me(req);

      expect(userService.findById).toHaveBeenCalledTimes(1);
      expect(userService.findById).toHaveBeenCalledWith(userId, {
        projects: true,
        settings: true,
      });
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("User not found");
      userService.findById.mockRejectedValue(error);

      await expect(controller.me(req)).rejects.toThrow(error);
    });
  });
  describe("passOboarding", () => {
    const userId = "user-123";

    const req = {
      user: {
        id: userId,
      },
    } as any;

    it("should mark the authenticated user as having passed onboarding", async () => {
      userService.passOnboarding.mockResolvedValue(undefined);

      await controller.passOboarding(req);

      expect(userService.passOnboarding).toHaveBeenCalledTimes(1);
      expect(userService.passOnboarding).toHaveBeenCalledWith(userId);
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("Failed to pass onboarding");
      userService.passOnboarding.mockRejectedValue(error);

      await expect(controller.passOboarding(req)).rejects.toThrow(error);
    });
  });
});
