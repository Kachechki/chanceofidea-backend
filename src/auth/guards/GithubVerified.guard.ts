import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { type IRequestWithRefresh } from "../../types/RequestWithRefresh.interface";

@Injectable()
export class GithubVerifiedGuard implements CanActivate {
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    // Depends on AuthGuard
    const req: IRequestWithRefresh = context.switchToHttp().getRequest()

    return req.user.githubVerified;
  }
}
