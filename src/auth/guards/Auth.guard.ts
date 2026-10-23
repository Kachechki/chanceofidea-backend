import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response } from "express";
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

    const res = ctx.getResponse<Response>();

    if (access) {
      req.user = this.jwtService.validateAccess(access);
      return true;
    }

    if (!refresh) throw new UnauthorizedException();

    const payload = this.jwtService.validateRefresh(refresh);
    const jwtPair = await this.jwtService.refresh(refresh);

    res.setHeader("x-access-token", jwtPair.access);
    res.cookie("refresh", jwtPair.refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    req.user = payload;

    return true;
  }

  private useAccess(req: IRequestWithRefresh): string | undefined {
    const [type, token] = req.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }

  private useRefresh(req: IRequestWithRefresh): string | undefined {
    return req.cookies?.refresh ?? undefined;
  }
}
