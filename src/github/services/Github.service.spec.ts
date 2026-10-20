import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GithubService } from "./Github.service";
import { UserService } from "../../user/services/User.service";
import { GithubAccessService } from "../../auth/services/GithubAccess.service";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";

describe("GithubService", () => {
  let service: GithubService;
  let userService: { findById: jest.Mock };
  let githubAccessService: { get: jest.Mock };
  let transferSessionService: { findById: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let fetchMock: jest.Mock;
  let originalFetch: typeof global.fetch;

  const makeResponse = (options: {
    ok: boolean;
    status?: number;
    json?: () => Promise<unknown>;
  }) =>
    ({
      ok: options.ok,
      status: options.status ?? (options.ok ? 200 : 500),
      json: options.json ?? (async () => []),
    }) as Response;

  beforeEach(async () => {
    originalFetch = global.fetch;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    userService = {
      findById: jest.fn(),
    };

    githubAccessService = {
      get: jest.fn(),
    };

    transferSessionService = {
      findById: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        { provide: UserService, useValue: userService },
        { provide: GithubAccessService, useValue: githubAccessService },
        {
          provide: TransferSessionService,
          useValue: transferSessionService,
        },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("fetchRepositories", () => {
    const ownerId = "owner-123";
    const owner = { id: ownerId, login: "repo-owner" };
    const accessToken = "github-access-token";

    beforeEach(() => {
      userService.findById.mockResolvedValue(owner);
      githubAccessService.get.mockResolvedValue(accessToken);
    });

    it("should retrieve the owner and GitHub access token", async () => {
      fetchMock.mockResolvedValue(
        makeResponse({
          ok: true,
          json: async () => [{ id: 1, name: "project" }],
        }),
      );

      await service.fetchRepositories(ownerId);

      expect(userService.findById).toHaveBeenCalledWith(ownerId);
      expect(githubAccessService.get).toHaveBeenCalledWith(owner);
    });

    it("should fetch repositories using the expected URL and headers", async () => {
      fetchMock.mockResolvedValue(
        makeResponse({
          ok: true,
          json: async () => [{ id: 1, name: "project" }],
        }),
      );

      await service.fetchRepositories(ownerId);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.github.com/user/repos?affiliation=owner&per_page=100&page=1",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2026-03-10",
          },
        },
      );
    });

    it("should return repositories from the first page", async () => {
      const repositories = [
        { id: 1, name: "project-a" },
        { id: 2, name: "project-b" },
      ];

      fetchMock.mockResolvedValue(
        makeResponse({
          ok: true,
          json: async () => repositories,
        }),
      );

      await expect(service.fetchRepositories(ownerId)).resolves.toEqual(
        repositories,
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should fetch subsequent pages when a page contains 100 repositories", async () => {
      const firstPage = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `project-${i + 1}`,
      }));
      const secondPage = [{ id: 101, name: "project-101" }];

      fetchMock
        .mockResolvedValueOnce(
          makeResponse({
            ok: true,
            json: async () => firstPage,
          }),
        )
        .mockResolvedValueOnce(
          makeResponse({
            ok: true,
            json: async () => secondPage,
          }),
        );

      const result = await service.fetchRepositories(ownerId);

      expect(result).toHaveLength(101);
      expect(result).toEqual([...firstPage, ...secondPage]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toBe(
        "https://api.github.com/user/repos?affiliation=owner&per_page=100&page=2",
      );
    });

    it("should stop fetching when a page contains fewer than 100 repositories", async () => {
      fetchMock.mockResolvedValue(
        makeResponse({
          ok: true,
          json: async () =>
            Array.from({ length: 99 }, (_, i) => ({
              id: i + 1,
              name: `project-${i + 1}`,
            })),
        }),
      );

      const result = await service.fetchRepositories(ownerId);

      expect(result).toHaveLength(99);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should throw when the GitHub API returns an unsuccessful response", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: false, status: 403 }));

      await expect(service.fetchRepositories(ownerId)).rejects.toThrow(
        "GitHub API error: 403",
      );
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("User not found");
      userService.findById.mockRejectedValue(error);

      await expect(service.fetchRepositories(ownerId)).rejects.toThrow(error);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should propagate errors from GithubAccessService", async () => {
      const error = new Error("Access token unavailable");
      githubAccessService.get.mockRejectedValue(error);

      await expect(service.fetchRepositories(ownerId)).rejects.toThrow(error);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("startGithubHandover", () => {
    const transferSessionId = "transfer-123";

    const transferSession = {
      project: {
        title: "My Project",
        repositoryName: "my-project",
        status: ProjectStatusEnum.PUBLISHED,
        owner: {
          login: "old-owner",
          githubAccessToken: {
            githubAccessToken: "owner-token",
          },
        },
      },
      applicant: {
        login: "new-owner",
      },
    };

    beforeEach(() => {
      transferSessionService.findById.mockResolvedValue(transferSession);
    });

    it("should retrieve the transfer session with the required relations", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.startGithubHandover(transferSessionId);

      expect(transferSessionService.findById).toHaveBeenCalledWith(
        transferSessionId,
        {
          project: { owner: { githubAccessToken: true } },
          applicant: true,
        },
      );
    });

    it("should request a GitHub repository transfer to the applicant", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.startGithubHandover(transferSessionId);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.github.com/repos/old-owner/my-project/transfer",
        {
          method: "POST",
          body: JSON.stringify({ new_owner: "new-owner" }),
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: "Bearer owner-token",
            "X-Github-Api-Version": "2026-03-10",
          },
        },
      );
    });

    it("should set the project status to TRANSFERRING after the response", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.startGithubHandover(transferSessionId);

      expect(transferSession.project.status).toBe(
        ProjectStatusEnum.TRANSFERRING,
      );
    });

    it("should emit a transfer termination event when GitHub rejects the transfer", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: false, status: 422 }));

      await expect(
        service.startGithubHandover(transferSessionId),
      ).rejects.toThrow("Github API error: 422");

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.termiated", {
        transferSessionId,
        failed: true,
      });
    });

    it("should not emit a termination event when the transfer succeeds", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.startGithubHandover(transferSessionId);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should propagate errors from TransferSessionService", async () => {
      const error = new Error("Transfer session not found");
      transferSessionService.findById.mockRejectedValue(error);

      await expect(
        service.startGithubHandover(transferSessionId),
      ).rejects.toThrow(error);

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("validateRepositry", () => {
    const data = {
      ownerLogin: "repo-owner",
      repositoryName: "my-project",
    };

    it("should return true when the repository exists and GitHub responds successfully", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await expect(service.validateRepositry(data)).resolves.toBe(true);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.github.com/repos/repo-owner/my-project",
      );
    });

    it("should return false when GitHub responds unsuccessfully", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: false, status: 404 }));

      await expect(service.validateRepositry(data)).resolves.toBe(false);
    });

    it("should propagate network errors", async () => {
      const error = new Error("Network failure");
      fetchMock.mockRejectedValue(error);

      await expect(service.validateRepositry(data)).rejects.toThrow(error);
    });
  });

  describe("finishGithubHandover", () => {
    const transferSessionId = "transfer-123";

    const transferSession = {
      createdAt: new Date("2026-10-20T12:00:00.000Z"),
      project: {
        title: "My Project",
        description: "A test project",
        readiness: 0.8,
        repositoryName: "my-project",
        owner: {
          login: "old-owner",
        },
      },
      applicant: {
        login: "new-owner",
      },
    };

    beforeEach(() => {
      transferSessionService.findById.mockResolvedValue(transferSession);
    });

    it("should retrieve the transfer session", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.finishGithubHandover(transferSessionId);

      expect(transferSessionService.findById).toHaveBeenCalledWith(
        transferSessionId,
      );
    });

    it("should create TRANSFER.md in the new owner's repository", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.finishGithubHandover(transferSessionId);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.github.com/repos/new-owner/my-project/contents/TRANSFER.md",
        expect.objectContaining({
          body: expect.any(String),
        }),
      );

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);

      expect(requestBody.message).toBe(
        "Create TRANSFER.md after repository transfer (by Chance of Idea team)",
      );

      const decodedContent = Buffer.from(
        requestBody.content,
        "base64",
      ).toString("utf-8");

      expect(decodedContent).toContain("# Repository Transfer Record");
      expect(decodedContent).toContain("**Project Title:** My Project");
      expect(decodedContent).toContain("**Previous Owner:** @old-owner");
      expect(decodedContent).toContain("**New Owner:** @new-owner");
      expect(decodedContent).toContain("**Description:** A test project");
      expect(decodedContent).toContain("**Readiness:** 0.8");
    });

    it("should emit transfer.finished when creating TRANSFER.md succeeds", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: true }));

      await service.finishGithubHandover(transferSessionId);

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.finished", {
        transferSessionId,
      });
    });

    it("should emit a termination event when creating TRANSFER.md fails", async () => {
      fetchMock.mockResolvedValue(makeResponse({ ok: false, status: 403 }));

      await expect(
        service.finishGithubHandover(transferSessionId),
      ).resolves.toBeUndefined();

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.termiated", {
        transferSessionId,
        failed: true,
      });

      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        "transfer.finished",
        expect.anything(),
      );
    });

    it("should propagate errors from TransferSessionService", async () => {
      const error = new Error("Transfer session not found");
      transferSessionService.findById.mockRejectedValue(error);

      await expect(
        service.finishGithubHandover(transferSessionId),
      ).rejects.toThrow(error);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("should propagate network errors when creating TRANSFER.md", async () => {
      const error = new Error("Network failure");
      fetchMock.mockRejectedValue(error);

      await expect(
        service.finishGithubHandover(transferSessionId),
      ).rejects.toThrow(error);
    });
  });
});
