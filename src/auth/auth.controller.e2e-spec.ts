import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import cookieParser from "cookie-parser";

import { AuthController } from "./auth.controller";
import { AuthService } from "./services/Auth.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  const authService = {
    authenticate: jest.fn(),
    refresh: jest.fn(),
    startEmailAuth: jest.fn(),
    finishEmailAuth: jest.fn(),
  };

  const jwtPair = {
    access: "test-access-token",
    refresh: "test-refresh-token",
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("GET /auth/oauth_callback", () => {
    it("should authenticate through GitHub and return JWT tokens", async () => {
      authService.authenticate.mockResolvedValue(jwtPair);

      const response = await request(app.getHttpServer())
        .get("/auth/oauth_callback")
        .query({ code: "github-oauth-code" })
        .expect(200);

      expect(authService.authenticate).toHaveBeenCalledWith(
        "github-oauth-code",
      );

      expect(response.headers["x-access-token"]).toBe(jwtPair.access);

      const cookie = response.headers["set-cookie"][0];

      expect(cookie).toContain(`refresh=${jwtPair.refresh}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
    });
  });

  describe("GET /auth/refresh", () => {
    it("should throw BadRequestException when refresh cookie is missing", async () => {
      await request(app.getHttpServer()).get("/auth/refresh").expect(400);

      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it("should refresh JWT tokens using the refresh cookie", async () => {
      authService.refresh.mockResolvedValue(jwtPair);

      const response = await request(app.getHttpServer())
        .get("/auth/refresh")
        .set("Cookie", "refresh=old-refresh-token")
        .expect(200);

      expect(authService.refresh).toHaveBeenCalledWith("old-refresh-token");

      expect(response.headers["x-access-token"]).toBe(jwtPair.access);

      const cookie = response.headers["set-cookie"][0];

      expect(cookie).toContain(`refresh=${jwtPair.refresh}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
    });
  });

  describe("POST /auth/email/start", () => {
    it("should start email authentication", async () => {
      authService.startEmailAuth.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post("/auth/email/start")
        .send({ email: "test@example.com" })
        .expect(201);

      expect(authService.startEmailAuth).toHaveBeenCalledWith(
        "test@example.com",
      );
    });
  });

  describe("POST /auth/email/finish", () => {
    it("should finish email authentication and return JWT tokens", async () => {
      authService.finishEmailAuth.mockResolvedValue(jwtPair);

      const response = await request(app.getHttpServer())
        .post("/auth/email/finish")
        .send({
          email: "test@example.com",
          code: "123456",
        })
        .expect(201);

      expect(authService.finishEmailAuth).toHaveBeenCalledWith({
        email: "test@example.com",
        code: "123456",
      });

      expect(response.headers["x-access-token"]).toBe(jwtPair.access);

      const cookie = response.headers["set-cookie"][0];

      expect(cookie).toContain(`refresh=${jwtPair.refresh}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
    });
  });
});
