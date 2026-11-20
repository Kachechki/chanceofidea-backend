import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { type IRequestWithRefresh } from "../../types/RequestWithRefresh.interface";
import { UserRoleEnum } from "../../enums/UserRole.enum";

export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req: IRequestWithRefresh = context.switchToHttp().getRequest();

    if (req.user.role.includes(UserRoleEnum.ADMIN)) return true;

    throw new ForbiddenException(
      "User must be an admin to access this feature",
    );
  }
}
