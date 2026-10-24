import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { AuthService } from "./services/Auth.service";
import type { Response, Request } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("oauth_callback")
  async oAuthCallback(
    @Query("code") code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const jwtPair = await this.authService.authenticate(code);

    res.set({ "x-access-token": jwtPair.access });
    res.cookie("refresh", jwtPair.refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }

  @Get("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh = req.get("refresh");
    if (!refresh)
      throw new BadRequestException("No refresh found. Log in again");

    const jwtPair = await this.authService.refresh(refresh);

    res.set({ "x-access-token": jwtPair.access });
    res.cookie("refresh", jwtPair.refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }
}
