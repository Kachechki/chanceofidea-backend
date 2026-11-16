import { Test, TestingModule } from "@nestjs/testing";
import { NotifiactionService } from "./services/Notification.service";
import { NotificationController } from "./notification.controller";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { NotificationEntity } from "./entites/Notification.entity";
import { ReadNotificationDto } from "../dto/ReadNotification.dto";
import { NotificationTypeEnum } from "../enum/NotificationType.enum";

describe("NotificationController", () => {
  let controller: NotificationController;
  let notificationService: jest.Mocked<NotifiactionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotifiactionService,
          useValue: {
            fetchAll: jest.fn(),
            delete: jest.fn(),
            deleteAll: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get(NotifiactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchAll", () => {
    const userId = "user-123";

    const req = {
      user: { id: userId },
    } as any;

    it("should return all notifications belonging to the authenticated user", async () => {
      const notifications = [
        {
          id: "notification-123",
          body: "Someone applied to your project",
          topic: "Project application",
          type: NotificationTypeEnum.NEW_APPLICATION,
          user: { id: userId },
        },
        {
          id: "notification-456",
          body: "Your project was accepted",
          topic: "Project update",
          type: NotificationTypeEnum.APPLICATION_UPDATED,
          user: { id: userId },
        },
      ] as NotificationEntity[];

      notificationService.fetchAll.mockResolvedValue(notifications);

      const result = await controller.fetchAll(req);

      expect(result).toEqual([
        {
          id: notifications[0].id,
          body: notifications[0].body,
          topic: notifications[0].topic,
        },
        {
          id: notifications[1].id,
          body: notifications[1].body,
          topic: notifications[1].topic,
        },
      ]);

      expect(notificationService.fetchAll).toHaveBeenCalledTimes(1);
      expect(notificationService.fetchAll).toHaveBeenCalledWith(userId);
    });

    it("should return an empty array when the user has no notifications", async () => {
      notificationService.fetchAll.mockResolvedValue([]);

      const result = await controller.fetchAll(req);

      expect(result).toEqual([]);
    });

    it("should not expose additional entity properties", async () => {
      const notification = {
        id: "notification-123",
        body: "Test notification",
        topic: "Test",
        user: { id: userId },
        createdAt: new Date(),
      } as unknown as NotificationEntity;

      notificationService.fetchAll.mockResolvedValue([notification]);

      const result = await controller.fetchAll(req);

      expect(result[0]).toEqual({
        id: notification.id,
        body: notification.body,
        topic: notification.topic,
      });

      expect(result[0]).not.toHaveProperty("user");
      expect(result[0]).not.toHaveProperty("createdAt");
    });

    it("should propagate errors from NotificationService", async () => {
      const error = new Error("Database error");

      notificationService.fetchAll.mockRejectedValue(error);

      await expect(controller.fetchAll(req)).rejects.toThrow(error);
    });
  });

  describe("read", () => {
    const userId = "user-123";

    const req = {
      user: { id: userId },
    } as any;

    const dto: ReadNotificationDto = {
      id: "notification-123",
    };

    it("should mark the notification as read", async () => {
      notificationService.delete.mockResolvedValue(undefined);

      await controller.read(dto, req);

      expect(notificationService.delete).toHaveBeenCalledTimes(1);
      expect(notificationService.delete).toHaveBeenCalledWith(dto.id, userId);
    });

    it("should propagate errors from NotificationService", async () => {
      const error = new Error("Notification not found");

      notificationService.delete.mockRejectedValue(error);

      await expect(controller.read(dto, req)).rejects.toThrow(error);
    });
  });

  describe("readAll", () => {
    const userId = "user-123";

    const req = {
      user: { id: userId },
    } as any;

    it("should mark all notifications as read", async () => {
      notificationService.deleteAll.mockResolvedValue(undefined);

      await controller.readAll(req);

      expect(notificationService.deleteAll).toHaveBeenCalledTimes(1);
      expect(notificationService.deleteAll).toHaveBeenCalledWith(userId);
    });

    it("should propagate errors from NotificationService", async () => {
      const error = new Error("Database error");

      notificationService.deleteAll.mockRejectedValue(error);

      await expect(controller.readAll(req)).rejects.toThrow(error);
    });
  });
});
