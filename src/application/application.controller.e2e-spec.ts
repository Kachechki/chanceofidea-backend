import { Test } from "@nestjs/testing";
import { ExecutionContext, INestApplication, ValidationPipe } from "@nestjs/common";
import { ApplicationService } from "./services/Application.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { ApplicationController } from "./application.controller";

describe("ApplicationController (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;

  const applicationService = {
    create: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
    findIncoming: jest.fn(),
    findOutcoming: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        {
          provide: ApplicationService,
          useValue: applicationService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            id: "5b0d1714-ccbb-11f1-8ef8-12fb85b8a57f",
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

    await app.listen(0);

    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /application should create an application", async () => {
    const response = await fetch(`${baseUrl}/application`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: "b5cae400-ccbc-11f1-b381-12fb85b8a57f",
        whyMe: "Because I'm the best software engineer ever!",
        plan: "I will finish this project.",
        portfolioUrl: "https://example.com",
      }),
    });

    expect(response.status).toBe(201);

    expect(applicationService.create).toHaveBeenCalledWith(
      {
        projectId: "b5cae400-ccbc-11f1-b381-12fb85b8a57f",
        whyMe: "Because I'm the best software engineer ever!",
        plan: "I will finish this project.",
        portfolioUrl: "https://example.com",
      },
      "5b0d1714-ccbb-11f1-8ef8-12fb85b8a57f",
    );
  });
});