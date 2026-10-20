import { Test, TestingModule } from "@nestjs/testing";
import { GithubService } from "./services/Github.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { GithubController } from "./github.controller";

describe("GithubController", () => {
  let controller: GithubController;
  let githubService: { fetchRepositories: jest.Mock };

  beforeEach(async () => {
    githubService = {
      fetchRepositories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        {
          provide: GithubService,
          useValue: githubService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<GithubController>(GithubController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchRepos", () => {
    const userId = "user-123";
    const req = {
      user: { id: userId },
    };

    it("should fetch repositories for the authenticated user", async () => {
      const repositories = [
        { id: 1, name: "project-a" },
        { id: 2, name: "project-b" },
      ];

      githubService.fetchRepositories.mockResolvedValue(repositories);

      await expect(controller.fetchRepos(req as any)).resolves.toBe(
        repositories,
      );

      expect(githubService.fetchRepositories).toHaveBeenCalledTimes(1);
      expect(githubService.fetchRepositories).toHaveBeenCalledWith(userId);
    });

    it("should return an empty array when the user has no repositories", async () => {
      githubService.fetchRepositories.mockResolvedValue([]);

      await expect(controller.fetchRepos(req as any)).resolves.toEqual([]);
    });

    it("should propagate errors from GithubService", async () => {
      const error = new Error("GitHub API error");
      githubService.fetchRepositories.mockRejectedValue(error);

      await expect(controller.fetchRepos(req as any)).rejects.toThrow(error);
    });
  });
});
