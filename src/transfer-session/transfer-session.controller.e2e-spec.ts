import {
  ConflictException,
  ExecutionContext,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { TransferSessionService } from "./services/TransferSession.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { TransferSessionController } from "./transfer-session.controller";

describe("TransferSessionController (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;

  const USER_ID = "c3408c0a-e0cd-41f1-b9ff-12fb85b8a57f";
  const APPLICATION_ID = "d1d4c5b0-e0cd-41f1-94bf-12fb85b8a57f";

  const transferSessionService = {
    iHaveRecievedTheRepo: jest.fn(),
    iDontWantTheRepo: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TransferSessionController],
      providers: [
        {
          provide: TransferSessionService,
          useValue: transferSessionService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            id: USER_ID,
          };

          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /transfer-session/i-have-recieved", () => {
    it("should confirm repository receipt", async () => {
      const response = await fetch(
        `${baseUrl}/transfer-session/i-have-recieved?applicationId=${APPLICATION_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(200);

      expect(transferSessionService.iHaveRecievedTheRepo).toHaveBeenCalledWith(
        USER_ID,
        APPLICATION_ID,
      );
    });

    it("should propagate a not found error", async () => {
      transferSessionService.iHaveRecievedTheRepo.mockRejectedValue(
        new NotFoundException("Transfer session not found"),
      );

      const response = await fetch(
        `${baseUrl}/transfer-session/i-have-recieved?applicationId=${APPLICATION_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(404);
    });

    it("should propagate a conflict error", async () => {
      transferSessionService.iHaveRecievedTheRepo.mockRejectedValue(
        new ConflictException("Transfer session cannot be confirmed"),
      );

      const response = await fetch(
        `${baseUrl}/transfer-session/i-have-recieved?applicationId=${APPLICATION_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(409);
    });
  });

  describe("POST /transfer-session/i-dont-want", () => {
    it("should decline repository transfer", async () => {
      const response = await fetch(
        `${baseUrl}/transfer-session/i-dont-want?applicationId=${APPLICATION_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(200);

      expect(transferSessionService.iDontWantTheRepo).toHaveBeenCalledWith(
        USER_ID,
        APPLICATION_ID,
      );
    });

    it("should propagate a not found error", async () => {
      transferSessionService.iDontWantTheRepo.mockRejectedValue(
        new NotFoundException("Transfer session not found"),
      );

      const response = await fetch(
        `${baseUrl}/transfer-session/i-dont-want?applicationId=${APPLICATION_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(404);
    });

    it("should propagate a conflict error", async () => {
      transferSessionService.iDontWantTheRepo.mockRejectedValue(
        new ConflictException("Transfer session cannot be declined"),
      );

      const response = await fetch(
        `${baseUrl}/transfer-session/i-dont-want?applicationId=${APPLICATION_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(409);
    });
  });
});
