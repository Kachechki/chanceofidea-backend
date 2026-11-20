import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository, DeleteResult } from "typeorm";

import { NotifiactionService } from "./Notification.service";
import { NotificationEntity } from "../entites/Notification.entity";
import { ICreateNotification } from "../../types/CreateNotification.interface";
import { NotificationTypeEnum } from "../../enums/NotificationType.enum";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";

describe("NotifiactionService", () => {
  let service: NotifiactionService;
  let repository: jest.Mocked<Repository<NotificationEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifiactionService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
            findBy: jest.fn(),
          },
        },
        {
          provide: TransferSessionService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotifiactionService>(NotifiactionService);
    repository = module.get(getRepositoryToken(NotificationEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const notificationData: ICreateNotification = {
      topic: "Project application",
      body: "Someone has applied to your project.",
      type: NotificationTypeEnum.NEW_APPLICATION,
      recieverId: "user-123",
    };

    it("should create a notification and return its ID", async () => {
      const savedNotification = {
        id: "notification-123",
      };

      repository.save.mockResolvedValue(
        savedNotification as NotificationEntity,
      );

      const result = await service.create(notificationData);

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith({
        topic: notificationData.topic,
        body: notificationData.body,
        type: notificationData.type,
        user: { id: notificationData.recieverId },
      });

      expect(result).toBe(savedNotification.id);
    });

    it("should propagate errors if saving the notification fails", async () => {
      const error = new Error("Database error");

      repository.save.mockRejectedValue(error);

      await expect(service.create(notificationData)).rejects.toThrow(error);
    });
  });

  describe("delete", () => {
    const notificationId = "notification-123";
    const userId = "user-123";

    it("should delete a notification belonging to the user", async () => {
      repository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      } as DeleteResult);

      await service.delete(notificationId, userId);

      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(repository.delete).toHaveBeenCalledWith({
        id: notificationId,
        user: { id: userId },
      });
    });

    it("should throw NotFoundException if the notification does not exist", async () => {
      repository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
      } as DeleteResult);

      await expect(service.delete(notificationId, userId)).rejects.toThrow(
        new NotFoundException("Notification not found"),
      );
    });

    it("should throw NotFoundException if the notification belongs to another user", async () => {
      repository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
      } as DeleteResult);

      await expect(service.delete(notificationId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.delete).toHaveBeenCalledWith({
        id: notificationId,
        user: { id: userId },
      });
    });

    it("should propagate errors if deleting the notification fails", async () => {
      const error = new Error("Database error");

      repository.delete.mockRejectedValue(error);

      await expect(service.delete(notificationId, userId)).rejects.toThrow(
        error,
      );
    });
  });

  describe("deleteAll", () => {
    const userId = "user-123";

    it("should delete all notifications belonging to the user", async () => {
      repository.delete.mockResolvedValue({
        affected: 3,
        raw: [],
      } as DeleteResult);

      await service.deleteAll(userId);

      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(repository.delete).toHaveBeenCalledWith({
        user: { id: userId },
      });
    });

    it("should not throw if the user has no notifications", async () => {
      repository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
      } as DeleteResult);

      await expect(service.deleteAll(userId)).resolves.toBeUndefined();
    });

    it("should propagate errors if deleting notifications fails", async () => {
      const error = new Error("Database error");

      repository.delete.mockRejectedValue(error);

      await expect(service.deleteAll(userId)).rejects.toThrow(error);
    });
  });

  describe("fetchAll", () => {
    const userId = "user-123";

    it("should return all notifications belonging to the user", async () => {
      const notifications = [
        {
          id: "notification-123",
          topic: "Project application",
          body: "Someone has applied to your project.",
        },
        {
          id: "notification-456",
          topic: "Project update",
          body: "Your project was updated.",
        },
      ] as NotificationEntity[];

      repository.findBy.mockResolvedValue(notifications);

      const result = await service.fetchAll(userId);

      expect(repository.findBy).toHaveBeenCalledTimes(1);
      expect(repository.findBy).toHaveBeenCalledWith({
        user: { id: userId },
      });

      expect(result).toBe(notifications);
    });

    it("should return an empty array if the user has no notifications", async () => {
      repository.findBy.mockResolvedValue([]);

      const result = await service.fetchAll(userId);

      expect(result).toEqual([]);
    });

    it("should propagate errors if fetching notifications fails", async () => {
      const error = new Error("Database error");

      repository.findBy.mockRejectedValue(error);

      await expect(service.fetchAll(userId)).rejects.toThrow(error);
    });
  });
});
