import { NotAcceptableException, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { TransferSessionEntity } from "../entities/TransferSession.entity";
import { TransferSessionService } from "./TransferSession.service";
import { TransferSessionStatusEnum } from "../../enums/TransferSessionStatusEnum.status";
import { UserService } from "../../user/services/User.service";
import { GithubService } from "../../github/services/Github.service";

type MockRepository = {
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  save: jest.Mock;
};

describe("TransferSessionService", () => {
  let service: TransferSessionService;
  let repository: MockRepository;
  let eventEmitter: { emit: jest.Mock };
  let userService: { findById: jest.Mock };
  let githubService: { validateRepositry: jest.Mock };

  const applicant = {
    id: "user-1",
    login: "new-owner",
  };

  const project = {
    id: "project-1",
    repositoryName: "my-repository",
  };

  const transferSession = {
    id: "transfer-1",
    status: TransferSessionStatusEnum.ACTIVE,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    applicant,
    project,
  } as TransferSessionEntity;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    userService = {
      findById: jest.fn(),
    };

    githubService = {
      validateRepositry: jest.fn(),
    };

    service = new TransferSessionService(
      repository as unknown as Repository<TransferSessionEntity>,
      eventEmitter as unknown as EventEmitter2,
      userService as unknown as UserService,
      githubService as unknown as GithubService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return the transfer session", async () => {
      repository.findOne.mockResolvedValue(transferSession);

      const result = await service.findById("transfer-1");

      expect(result).toBe(transferSession);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: "transfer-1" },
        relations: undefined,
      });
    });

    it("should pass the requested relations to the repository", async () => {
      repository.findOne.mockResolvedValue(transferSession);

      const relations = {
        applicant: true,
        project: true,
      };

      await service.findById("transfer-1", relations);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: "transfer-1" },
        relations,
      });
    });

    it("should throw NotFoundException if the session does not exist", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById("missing-id")).rejects.toThrow(
        new NotFoundException("Transfer session not found"),
      );
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.findOne.mockRejectedValue(error);

      await expect(service.findById("transfer-1")).rejects.toThrow(error);
    });
  });

  describe("save", () => {
    it("should save the supplied transfer session fields", async () => {
      const data = {
        id: "transfer-1",
        status: TransferSessionStatusEnum.FINISHED,
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      };

      await service.save(data);

      expect(repository.save).toHaveBeenCalledWith(data);
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database error");
      repository.save.mockRejectedValue(error);

      await expect(
        service.save({
          id: "transfer-1",
          status: TransferSessionStatusEnum.FINISHED,
          createdAt: transferSession.createdAt,
        }),
      ).rejects.toThrow(error);
    });
  });

  describe("handleTransferTerminated", () => {
    it("should mark the session as FAILED when the transfer failed", async () => {
      const session = { ...transferSession };
      repository.findOne.mockResolvedValue(session);

      await service.handleTransferTerminated("transfer-1", true);

      expect(session.status).toBe(TransferSessionStatusEnum.FAILED);
      expect(repository.save).toHaveBeenCalledWith(session);
    });

    it("should mark the session as CANCELED when the transfer was not a failure", async () => {
      const session = { ...transferSession };
      repository.findOne.mockResolvedValue(session);

      await service.handleTransferTerminated("transfer-1", false);

      expect(session.status).toBe(TransferSessionStatusEnum.CANCELED);
      expect(repository.save).toHaveBeenCalledWith(session);
    });

    it("should propagate errors when the session cannot be found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.handleTransferTerminated("missing-id", true),
      ).rejects.toThrow(new NotFoundException("Transfer session not found"));

      expect(repository.save).not.toHaveBeenCalled();
    });

    it("should propagate errors when saving the updated session fails", async () => {
      repository.findOne.mockResolvedValue({ ...transferSession });
      const error = new Error("Database error");
      repository.save.mockRejectedValue(error);

      await expect(
        service.handleTransferTerminated("transfer-1", true),
      ).rejects.toThrow(error);
    });
  });

  describe("handleTransferSuccess", () => {
    it("should mark the session as FINISHED", async () => {
      const session = { ...transferSession };
      repository.findOne.mockResolvedValue(session);

      await service.handleTransferSuccess("transfer-1");

      expect(session.status).toBe(TransferSessionStatusEnum.FINISHED);
      expect(repository.save).toHaveBeenCalledWith(session);
    });

    it("should throw NotFoundException if the session does not exist", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.handleTransferSuccess("missing-id")).rejects.toThrow(
        new NotFoundException("Transfer session not found"),
      );
    });

    it("should propagate errors when saving the updated session fails", async () => {
      repository.findOne.mockResolvedValue({ ...transferSession });
      const error = new Error("Database error");
      repository.save.mockRejectedValue(error);

      await expect(service.handleTransferSuccess("transfer-1")).rejects.toThrow(
        error,
      );
    });
  });

  describe("iHaveRecievedTheRepo", () => {
    beforeEach(() => {
      userService.findById.mockResolvedValue(applicant);
      repository.findOneBy.mockResolvedValue(transferSession);
      githubService.validateRepositry.mockResolvedValue(true);
    });

    it("should emit transfer.success when the applicant has received the repository", async () => {
      await service.iHaveRecievedTheRepo("user-1");

      expect(userService.findById).toHaveBeenCalledWith("user-1");
      expect(repository.findOneBy).toHaveBeenCalledWith({
        applicant: { id: applicant.id },
      });
      expect(githubService.validateRepositry).toHaveBeenCalledWith({
        ownerLogin: applicant.login,
        repositoryName: project.repositoryName,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.success", {
        transferSessionId: transferSession.id,
      });
    });

    it("should throw NotFoundException if no transfer session exists", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.iHaveRecievedTheRepo("user-1")).rejects.toThrow(
        new NotFoundException("Transfer session not found"),
      );

      expect(githubService.validateRepositry).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should throw NotAcceptableException if the repository transfer has not been accepted", async () => {
      githubService.validateRepositry.mockResolvedValue(false);

      await expect(service.iHaveRecievedTheRepo("user-1")).rejects.toThrow(
        new NotAcceptableException(
          "You have not yet accepted the repository transfer",
        ),
      );

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("User lookup failed");
      userService.findById.mockRejectedValue(error);

      await expect(service.iHaveRecievedTheRepo("user-1")).rejects.toThrow(
        error,
      );
    });

    it("should propagate errors from GitHub validation", async () => {
      const error = new Error("GitHub API error");
      githubService.validateRepositry.mockRejectedValue(error);

      await expect(service.iHaveRecievedTheRepo("user-1")).rejects.toThrow(
        error,
      );
    });
  });

  describe("iDontWantTheRepo", () => {
    beforeEach(() => {
      userService.findById.mockResolvedValue(applicant);
      repository.findOne.mockResolvedValue(transferSession);
      githubService.validateRepositry.mockResolvedValue(false);
    });

    it("should emit transfer.terminated when the applicant has not accepted the repository", async () => {
      await service.iDontWantTheRepo("user-1");

      expect(userService.findById).toHaveBeenCalledWith("user-1");
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { applicant: { id: applicant.id } },
        relations: { project: true },
      });
      expect(githubService.validateRepositry).toHaveBeenCalledWith({
        ownerLogin: applicant.login,
        repositoryName: project.repositoryName,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.terminated", {
        transferSessionId: transferSession.id,
        failed: false,
      });
    });

    it("should throw NotFoundException if no transfer session exists", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.iDontWantTheRepo("user-1")).rejects.toThrow(
        new NotFoundException("Transfer session not found"),
      );

      expect(githubService.validateRepositry).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should throw NotAcceptableException if the applicant has already accepted the repository", async () => {
      githubService.validateRepositry.mockResolvedValue(true);

      await expect(service.iDontWantTheRepo("user-1")).rejects.toThrow(
        new NotAcceptableException(
          "You have actually accepted the repository transfer",
        ),
      );

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("User lookup failed");
      userService.findById.mockRejectedValue(error);

      await expect(service.iDontWantTheRepo("user-1")).rejects.toThrow(error);
    });

    it("should propagate errors from GitHub validation", async () => {
      const error = new Error("GitHub API error");
      githubService.validateRepositry.mockRejectedValue(error);

      await expect(service.iDontWantTheRepo("user-1")).rejects.toThrow(error);
    });
  });
});
