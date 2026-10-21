import { Test, TestingModule } from "@nestjs/testing";
import { CanActivate } from "@nestjs/common";
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
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest
          .fn()
          .mockReturnValue(true),
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
      projects: [
        {
          id: "project-123",
          title: "Test project",
        },
      ],
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
      });
    });

    it("should find the user by the authenticated user's ID and load projects", async () => {
      userService.findById.mockResolvedValue(user);

      await controller.me(req);

      expect(userService.findById).toHaveBeenCalledTimes(1);
      expect(userService.findById).toHaveBeenCalledWith(userId, {
        projects: true,
      });
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("User not found");
      userService.findById.mockRejectedValue(error);

      await expect(controller.me(req)).rejects.toThrow(error);
    });
  });
});
