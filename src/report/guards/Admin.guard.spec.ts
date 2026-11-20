import { BadRequestException, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { AdminGuard } from "./Admin.guard";
import { UserRoleEnum } from "../../enum/UserRole.enum";
import { type IRequestWithRefresh } from "../../types/RequestWithRefresh.interface";

describe("AdminGuard", () => {
  let guard: AdminGuard;

  const createMockContext = (roles: UserRoleEnum[]): ExecutionContext => {
    const req = {
      user: {
        id: "user-1",
        role: roles,
      },
    } as unknown as IRequestWithRefresh;

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(req),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it("should allow access if user is an admin", () => {
    const context = createMockContext([UserRoleEnum.ADMIN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow access if user has multiple roles including admin", () => {
    const context = createMockContext([UserRoleEnum.USER, UserRoleEnum.ADMIN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException if user is not an admin", () => {
    const context = createMockContext([UserRoleEnum.USER]);

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException("User must be an admin to access this feature"),
    );
  });

  it("should throw ForbiddenException if user has no roles", () => {
    const context = createMockContext([]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
