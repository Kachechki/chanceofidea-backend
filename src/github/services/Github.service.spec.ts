import { jest as jestModule } from "@jest/globals";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";

type MockOctokit = {
  paginate: jest.Mock;
  rest: {
    repos: {
      listForAuthenticatedUser: jest.Mock;
      transfer: jest.Mock;
      get: jest.Mock;
      createOrUpdateFileContents: jest.Mock;
    };
  };
};

const mockOctokit: MockOctokit = {
  paginate: jest.fn(),
  rest: {
    repos: {
      listForAuthenticatedUser: jest.fn(),
      transfer: jest.fn(),
      get: jest.fn(),
      createOrUpdateFileContents: jest.fn(),
    },
  },
};

jestModule.unstable_mockModule("octokit", () => ({
  Octokit: jest.fn(() => mockOctokit),
}));

describe("GithubService", () => {
  type GithubServiceConstructor =
    typeof import("./Github.service.js").GithubService;

  let Test: typeof import("@nestjs/testing").Test;
  let EventEmitter2: typeof import("@nestjs/event-emitter").EventEmitter2;
  let UserService: typeof import("../../user/services/User.service").UserService;
  let GithubAccessService: typeof import("../../auth/services/GithubAccess.service").GithubAccessService;
  let TransferSessionService: typeof import("../../transfer-session/services/TransferSession.service").TransferSessionService;
  let GithubService: GithubServiceConstructor;
  let Octokit: jest.Mock;
  let service: InstanceType<GithubServiceConstructor>;
  let userService: { findById: jest.Mock };
  let githubAccessService: { get: jest.Mock };
  let transferSessionService: { findById: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const getOctokit = (): MockOctokit => mockOctokit;

  beforeAll(async () => {
    const [
      testingModule,
      eventEmitterModule,
      userServiceModule,
      githubAccessModule,
      transferSessionModule,
      octokitModule,
      githubServiceModule,
    ] = await Promise.all([
      import("@nestjs/testing"),
      import("@nestjs/event-emitter"),
      import("../../user/services/User.service.js"),
      import("../../auth/services/GithubAccess.service.js"),
      import("../../transfer-session/services/TransferSession.service.js"),
      import("octokit"),
      import("./Github.service.js"),
    ]);

    Test = testingModule.Test;
    EventEmitter2 = eventEmitterModule.EventEmitter2;
    UserService = userServiceModule.UserService;
    GithubAccessService = githubAccessModule.GithubAccessService;
    TransferSessionService = transferSessionModule.TransferSessionService;
    Octokit = octokitModule.Octokit as unknown as jest.Mock;
    GithubService = githubServiceModule.GithubService;
  });

  beforeEach(async () => {
    Octokit.mockClear();
    Octokit.mockImplementation(() => mockOctokit);
    mockOctokit.paginate.mockReset();
    Object.values(mockOctokit.rest.repos).forEach((mock) => mock.mockReset());

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

    const module = await Test.createTestingModule({
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

    service = module.get<InstanceType<GithubServiceConstructor>>(GithubService);
  });

  afterEach(() => {
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
      await service.fetchRepositories(ownerId);

      expect(userService.findById).toHaveBeenCalledWith(ownerId);
      expect(githubAccessService.get).toHaveBeenCalledWith(owner);
      expect(Octokit).toHaveBeenCalledWith({
        auth: accessToken,
      });
    });

    it("should initialize Octokit with the owner's access token", async () => {
      getOctokit().paginate.mockResolvedValue([]);

      await service.fetchRepositories(ownerId);

      expect(Octokit).toHaveBeenCalledWith({
        auth: accessToken,
      });
    });

    it("should paginate the authenticated owner's repositories", async () => {
      const repositories = [
        { id: 1, name: "project-a" },
        { id: 2, name: "project-b" },
      ];

      getOctokit().paginate.mockResolvedValue(repositories);

      await expect(service.fetchRepositories(ownerId)).resolves.toEqual(
        repositories,
      );

      expect(getOctokit().paginate).toHaveBeenCalledWith(
        getOctokit().rest.repos.listForAuthenticatedUser,
        {
          affiliation: "owner",
          per_page: 100,
        },
      );
    });

    it("should propagate errors from UserService", async () => {
      const error = new Error("User not found");
      userService.findById.mockRejectedValue(error);

      await expect(service.fetchRepositories(ownerId)).rejects.toThrow(error);

      expect(githubAccessService.get).not.toHaveBeenCalled();
      expect(Octokit).not.toHaveBeenCalled();
    });

    it("should propagate errors from GithubAccessService", async () => {
      const error = new Error("Access token unavailable");
      githubAccessService.get.mockRejectedValue(error);

      await expect(service.fetchRepositories(ownerId)).rejects.toThrow(error);

      expect(Octokit).not.toHaveBeenCalled();
    });

    it("should propagate errors from Octokit pagination", async () => {
      const error = new Error("GitHub API error");
      getOctokit().paginate.mockRejectedValue(error);

      await expect(service.fetchRepositories(ownerId)).rejects.toThrow(error);
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
      githubAccessService.get.mockResolvedValue("owner-token");
    });

    it("should retrieve the transfer session with the required relations", async () => {
      getOctokit().rest.repos.transfer.mockResolvedValue({ data: {} });

      await service.startGithubHandover({ transferSessionId });

      expect(transferSessionService.findById).toHaveBeenCalledWith(
        transferSessionId,
        {
          project: { owner: { githubAccessToken: true } },
          applicant: true,
        },
      );
    });

    it("should retrieve the owner's access token and initialize Octokit", async () => {
      getOctokit().rest.repos.transfer.mockResolvedValue({ data: {} });

      await service.startGithubHandover({ transferSessionId });

      expect(githubAccessService.get).toHaveBeenCalledWith(
        transferSession.project.owner,
      );
      expect(Octokit).toHaveBeenCalledWith({
        auth: "owner-token",
      });
    });

    it("should request a repository transfer to the applicant", async () => {
      getOctokit().rest.repos.transfer.mockResolvedValue({ data: {} });

      await service.startGithubHandover({ transferSessionId });

      expect(getOctokit().rest.repos.transfer).toHaveBeenCalledWith({
        owner: "old-owner",
        repo: "my-project",
        new_owner: "new-owner",
      });
    });

    it("should set the project status to TRANSFERRING after the transfer succeeds", async () => {
      getOctokit().rest.repos.transfer.mockResolvedValue({ data: {} });

      await service.startGithubHandover({ transferSessionId });

      expect(transferSession.project.status).toBe(
        ProjectStatusEnum.TRANSFERRING,
      );
    });

    it("should emit a termination event and rethrow when GitHub rejects the transfer", async () => {
      const error = Object.assign(new Error("Transfer rejected"), {
        status: 422,
      });

      getOctokit().rest.repos.transfer.mockRejectedValue(error);

      await expect(
        service.startGithubHandover({ transferSessionId }),
      ).rejects.toThrow(error);

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.termiated", {
        transferSessionId,
        failed: true,
      });
    });

    it("should not emit a termination event when the transfer succeeds", async () => {
      getOctokit().rest.repos.transfer.mockResolvedValue({ data: {} });

      await service.startGithubHandover({ transferSessionId });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should propagate errors from TransferSessionService", async () => {
      const error = new Error("Transfer session not found");
      transferSessionService.findById.mockRejectedValue(error);

      await expect(
        service.startGithubHandover({ transferSessionId }),
      ).rejects.toThrow(error);

      expect(githubAccessService.get).not.toHaveBeenCalled();
      expect(Octokit).not.toHaveBeenCalled();
    });

    it("should propagate errors from GithubAccessService", async () => {
      const error = new Error("Access token unavailable");
      githubAccessService.get.mockRejectedValue(error);

      await expect(
        service.startGithubHandover({ transferSessionId }),
      ).rejects.toThrow(error);

      expect(Octokit).not.toHaveBeenCalled();
    });
  });

  describe("validateRepositry", () => {
    const data = {
      ownerLogin: "repo-owner",
      repositoryName: "my-project",
    };

    it("should return true when the repository exists", async () => {
      getOctokit().rest.repos.get.mockResolvedValue({ data: {} });

      await expect(service.validateRepositry(data)).resolves.toBe(true);

      expect(Octokit).toHaveBeenCalledWith();
      expect(getOctokit().rest.repos.get).toHaveBeenCalledWith({
        owner: data.ownerLogin,
        repo: data.repositoryName,
      });
    });

    it("should return false when GitHub returns a 404", async () => {
      const error = Object.assign(new Error("Not Found"), {
        status: 404,
      });

      getOctokit().rest.repos.get.mockRejectedValue(error);

      await expect(service.validateRepositry(data)).resolves.toBe(false);
    });

    it("should propagate errors other than 404", async () => {
      const error = Object.assign(new Error("Forbidden"), {
        status: 403,
      });

      getOctokit().rest.repos.get.mockRejectedValue(error);

      await expect(service.validateRepositry(data)).rejects.toThrow(error);
    });

    it("should propagate network errors", async () => {
      const error = new Error("Network failure");
      getOctokit().rest.repos.get.mockRejectedValue(error);

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
      githubAccessService.get.mockResolvedValue("new-owner-token");
    });

    it("should retrieve the transfer session with the required relations", async () => {
      getOctokit().rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: {},
      });

      await service.finishGithubHandover({ transferSessionId });

      expect(transferSessionService.findById).toHaveBeenCalledWith(
        transferSessionId,
        {
          project: { owner: true },
          applicant: { githubAccessToken: true },
        },
      );
    });

    it("should initialize Octokit using the new owner's access token", async () => {
      getOctokit().rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: {},
      });

      await service.finishGithubHandover({ transferSessionId });

      expect(githubAccessService.get).toHaveBeenCalledWith(
        transferSession.applicant,
      );
      expect(Octokit).toHaveBeenCalledWith({
        auth: "new-owner-token",
      });
    });

    it("should create TRANSFER.md in the new owner's repository", async () => {
      getOctokit().rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: {},
      });

      await service.finishGithubHandover({ transferSessionId });

      expect(
        getOctokit().rest.repos.createOrUpdateFileContents,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "new-owner",
          repo: "my-project",
          path: "TRANSFER.md",
          message:
            "Create TRANSFER.md after repository transfer (by Chance of Idea team)",
          content: expect.any(String),
        }),
      );

      const request =
        getOctokit().rest.repos.createOrUpdateFileContents.mock.calls[0][0];

      const decodedContent = Buffer.from(request.content, "base64").toString(
        "utf8",
      );

      expect(decodedContent).toContain("# Repository Transfer Record");
      expect(decodedContent).toContain("**Project Title:** My Project");
      expect(decodedContent).toContain("**Previous Owner:** @old-owner");
      expect(decodedContent).toContain("**New Owner:** @new-owner");
      expect(decodedContent).toContain("**Description:** A test project");
      expect(decodedContent).toContain("**Readiness:** 0.8");
    });

    it("should emit transfer.finished when creating TRANSFER.md succeeds", async () => {
      getOctokit().rest.repos.createOrUpdateFileContents.mockResolvedValue({
        data: {},
      });

      await service.finishGithubHandover({ transferSessionId });

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.finished", {
        transferSessionId,
      });
    });

    it("should emit a termination event when creating TRANSFER.md fails", async () => {
      const error = Object.assign(new Error("Forbidden"), {
        status: 403,
      });

      getOctokit().rest.repos.createOrUpdateFileContents.mockRejectedValue(
        error,
      );

      await expect(
        service.finishGithubHandover({ transferSessionId }),
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
        service.finishGithubHandover({ transferSessionId }),
      ).rejects.toThrow(error);

      expect(githubAccessService.get).not.toHaveBeenCalled();
      expect(Octokit).not.toHaveBeenCalled();
    });

    it("should emit a termination event when GithubAccessService fails", async () => {
      const error = new Error("Access token unavailable");
      githubAccessService.get.mockRejectedValue(error);

      await expect(
        service.finishGithubHandover({ transferSessionId }),
      ).resolves.toBeUndefined();

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.termiated", {
        transferSessionId,
        failed: true,
      });
    });

    it("should handle network errors when creating TRANSFER.md", async () => {
      const error = new Error("Network failure");

      getOctokit().rest.repos.createOrUpdateFileContents.mockRejectedValue(
        error,
      );

      await expect(
        service.finishGithubHandover({ transferSessionId }),
      ).resolves.toBeUndefined();

      expect(eventEmitter.emit).toHaveBeenCalledWith("transfer.termiated", {
        transferSessionId,
        failed: true,
      });
    });
  });
});
