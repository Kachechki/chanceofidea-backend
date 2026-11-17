import { type ExecutionContext } from "@nestjs/common";
import { GithubVerifiedGuard } from "./GithubVerified.guard";

describe("GithubVerifiedGuard", () => {
  let guard: GithubVerifiedGuard;

  const mockExecutionContext = (githubVerified: boolean) => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            githubVerified,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new GithubVerifiedGuard();
  });

  describe("canActivate", () => {
    it("should return true when the user has verified their GitHub account", async () => {
      const context = mockExecutionContext(true);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it("should return false when the user has not verified their GitHub account", async () => {
      const context = mockExecutionContext(false);

      await expect(guard.canActivate(context)).resolves.toBe(false);
    });
  });
});
