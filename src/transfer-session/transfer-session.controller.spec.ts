import { Test, TestingModule } from "@nestjs/testing";
import { TransferSessionController } from "./transfer-session.controller";
import { TransferSessionService } from "./services/TransferSession.service";
import { AuthGuard } from "../auth/guards/Auth.guard";

describe("TransferSessionController", () => {
  let controller: TransferSessionController;
  let transferSessionService: jest.Mocked<TransferSessionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferSessionController],
      providers: [
        {
          provide: TransferSessionService,
          useValue: {
            iHaveRecievedTheRepo: jest.fn(),
            iDontWantTheRepo: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<TransferSessionController>(
      TransferSessionController,
    );
    transferSessionService = module.get(TransferSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("iHaveRecievedTheRepository", () => {
    it("should confirm repository receipt for the authenticated user", async () => {
      const userId = "user-123";
      const dto = { applicationId: "application-123" };
      const req = { user: { id: userId } } as any;

      await controller.iHaveRecievedTheRepository(req, dto);

      expect(transferSessionService.iHaveRecievedTheRepo).toHaveBeenCalledTimes(
        1,
      );
      expect(transferSessionService.iHaveRecievedTheRepo).toHaveBeenCalledWith(
        userId,
        dto.applicationId,
      );
    });

    it("should propagate errors from the service", async () => {
      const dto = { applicationId: "application-123" };
      const req = { user: { id: "user-123" } } as any;
      const error = new Error("Transfer session not found");

      transferSessionService.iHaveRecievedTheRepo.mockRejectedValue(error);

      await expect(
        controller.iHaveRecievedTheRepository(req, dto),
      ).rejects.toThrow(error);
    });
  });

  describe("iDontWantTheRepository", () => {
    it("should reject the repository for the authenticated user", async () => {
      const userId = "user-123";
      const dto = { applicationId: "application-123" };
      const req = { user: { id: userId } } as any;

      await controller.iDontWantTheRepository(req, dto);

      expect(transferSessionService.iDontWantTheRepo).toHaveBeenCalledTimes(1);
      expect(transferSessionService.iDontWantTheRepo).toHaveBeenCalledWith(
        userId,
        dto.applicationId,
      );
    });

    it("should propagate errors from the service", async () => {
      const dto = { applicationId: "application-123" };
      const req = { user: { id: "user-123" } } as any;
      const error = new Error("Transfer session not found");

      transferSessionService.iDontWantTheRepo.mockRejectedValue(error);

      await expect(
        controller.iDontWantTheRepository(req, dto),
      ).rejects.toThrow(error);
    });
  });
});
