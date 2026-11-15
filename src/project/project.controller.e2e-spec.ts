import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { ProjectService } from "./services/Project.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { GithubVerifiedGuard } from "../auth/guards/GithubVerified.guard";
import { ProjectGuard } from "./guards/Project.guard";
import { ProjectController } from "./project.controller";

describe("ProjectController (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;

  const USER_ID = "c3408c0a-e0cd-41f1-b9ff-12fb85b8a57f";
  const PROJECT_ID = "d1d4c5b0-e0cd-41f1-94bf-12fb85b8a57f";
  const CATEGORY_ID = "d8e37c16-e0cd-41f1-8954-12fb85b8a57f";
  const TAG_ID = "de0d1788-e0cd-41f1-b165-12fb85b8a57f";

  const projectService = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    publish: jest.fn(),
    search: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: projectService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: USER_ID };
          return true;
        },
      })
      .overrideGuard(GithubVerifiedGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(ProjectGuard)
      .useValue({
        canActivate: () => true,
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

  // POST /project

  describe("POST /project", () => {
    it("should create a project", async () => {
      const dto = {
        title: "Chance of Idea",
        readiness: 0.6,
        description: "A marketplace for unfinished side projects.",
        repositoryName: "chance-of-idea",
        categoryId: CATEGORY_ID,
        tags: [TAG_ID],
        publish: true,
      };

      const response = await fetch(`${baseUrl}/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      });
      console.log(
        "STATUS:",
        response.status,
        "BODY:",
        await response.clone().text(),
      );

      expect(response.status).toBe(201);

      expect(projectService.create).toHaveBeenCalledWith({
        ...dto,
        ownerId: USER_ID,
      });
    });

    it("should reject invalid project data", async () => {
      const response = await fetch(`${baseUrl}/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: 123,
          description: "Description",
          repositoryName: "repository",
          categoryId: "invalid-uuid",
          tags: [],
          publish: "yes",
        }),
      });

      expect(response.status).toBe(400);
      expect(projectService.create).not.toHaveBeenCalled();
    });

    it("should transform and clamp readiness to 1", async () => {
      const response = await fetch(`${baseUrl}/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test project",
          readiness: 1.5,
          description: "Description",
          repositoryName: "repository",
          categoryId: CATEGORY_ID,
          tags: [],
          publish: false,
        }),
      });

      expect(response.status).toBe(201);

      expect(projectService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          readiness: 1,
          ownerId: USER_ID,
        }),
      );
    });
  });

  // GET /project

  describe("GET /project", () => {
    it("should retrieve a project and map its response", async () => {
      const createdAt = "2026-11-14T10:00:00.000Z";

      const project = {
        id: PROJECT_ID,
        title: "Chance of Idea",
        category: {
          id: CATEGORY_ID,
          name: "Development",
        },
        createdAt,
        description: "A marketplace for unfinished side projects.",
        owner: {
          id: USER_ID,
          avatarUrl: "https://example.com/avatar.png",
          bio: "Full-stack developer",
          createdAt,
          login: "developer",
          settings: {
            id: "770a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
            prefferedLocale: "EN",
            theme: "DARK",
          },
        },
        repositoryName: "chance-of-idea",
        status: "PUBLISHED",
        tags: [
          {
            id: TAG_ID,
            name: "NestJS",
          },
        ],
      };

      projectService.findById.mockResolvedValue(project);

      const response = await fetch(`${baseUrl}/project?id=${PROJECT_ID}`);

      expect(response.status).toBe(200);

      const body = await response.json();

      expect(body).toEqual({
        id: PROJECT_ID,
        title: project.title,
        category: project.category,
        createdAt,
        description: project.description,
        owner: project.owner,
        repositoryName: project.repositoryName,
        status: project.status,
        tags: project.tags,
      });

      expect(projectService.findById).toHaveBeenCalledWith(PROJECT_ID, {
        applications: true,
        category: true,
        owner: {
          settings: true,
        },
        tags: true,
      });
    });

    it("should reject an invalid project ID", async () => {
      const response = await fetch(`${baseUrl}/project?id=not-a-uuid`);

      expect(response.status).toBe(400);
      expect(projectService.findById).not.toHaveBeenCalled();
    });
  });

  // PATCH /project

  describe("PATCH /project", () => {
    it("should update a project", async () => {
      const dto = {
        id: PROJECT_ID,
        title: "Updated project title",
        readiness: 0.75,
        description: "Updated description",
        tags: [TAG_ID],
      };

      const response = await fetch(`${baseUrl}/project`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      });

      expect(response.status).toBe(200);
      expect(projectService.update).toHaveBeenCalledWith(dto);
    });

    it("should reject invalid update data", async () => {
      const response = await fetch(`${baseUrl}/project`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "invalid-uuid",
          title: 123,
        }),
      });

      expect(response.status).toBe(400);
      expect(projectService.update).not.toHaveBeenCalled();
    });
  });

  // DELETE /project

  describe("DELETE /project", () => {
    it("should delete a project", async () => {
      const response = await fetch(`${baseUrl}/project?id=${PROJECT_ID}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");

      expect(projectService.delete).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("should reject an invalid project ID", async () => {
      const response = await fetch(`${baseUrl}/project?id=invalid`, {
        method: "DELETE",
      });

      expect(response.status).toBe(400);
      expect(projectService.delete).not.toHaveBeenCalled();
    });
  });

  // POST /project/publish

  describe("POST /project/publish", () => {
    it("should publish a project", async () => {
      const response = await fetch(
        `${baseUrl}/project/publish?id=${PROJECT_ID}`,
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(201);
      expect(projectService.publish).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("should reject an invalid project ID", async () => {
      const response = await fetch(`${baseUrl}/project/publish?id=invalid`, {
        method: "POST",
      });

      expect(response.status).toBe(400);
      expect(projectService.publish).not.toHaveBeenCalled();
    });
  });

  // GET /project/projects

  describe("GET /project/projects", () => {
    it("should search projects with filters and pagination", async () => {
      const projects = [
        {
          id: PROJECT_ID,
          title: "Chance of Idea",
        },
      ];

      projectService.search.mockResolvedValue(projects);

      const params = new URLSearchParams({
        page: "2",
        searchQuery: "telegram bot",
      });

      params.append("categorySlugs", "web-development");
      params.append("categorySlugs", "machine-learning");
      params.append("tagSlugs", "nestjs");
      params.append("tagSlugs", "typescript");

      const response = await fetch(
        `${baseUrl}/project/projects?${params.toString()}`,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(projects);

      expect(projectService.search).toHaveBeenCalledWith({
        page: 2,
        searchQuery: "telegram bot",
        categorySlugs: ["web-development", "machine-learning"],
        tagSlugs: ["nestjs", "typescript"],
      });
    });

    it("should reject invalid pagination parameters", async () => {
      const response = await fetch(`${baseUrl}/project/projects?page=0`);

      expect(response.status).toBe(400);
      expect(projectService.search).not.toHaveBeenCalled();
    });
  });
});
