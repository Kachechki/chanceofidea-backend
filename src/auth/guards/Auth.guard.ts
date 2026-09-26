import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { IRequestWithRefresh } from "../../types/RequestWithRefresh.interface";
import { JwtTokenService } from "../services/Jwt.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest<IRequestWithRefresh>();

    const access = this.useAccess(req);
    const refresh = this.useRefresh(req);

    const res = ctx.getResponse();

    if (!access && !refresh) throw new UnauthorizedException();

    if (!access && refresh) {
      const payload = this.jwtService.validateRefresh(refresh);

      const newAccess = (await this.jwtService.refresh(refresh)).access;

      res.setHeader("x-access-token", newAccess);
      res.setHeader("x-refresh-token", refresh);

      req.user = payload;

      return true;
    }

    if (!refresh && access) {
      const payload = this.jwtService.validateAccess(access);

      req.user = payload;
      return true;
    }

    return false;
  }

  private useAccess(req: IRequestWithRefresh): string | undefined {
    const [type, token] = req.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }

  private useRefresh(req: IRequestWithRefresh): string | undefined {
    return req.cookies?.refresh ?? undefined;
  }
}
