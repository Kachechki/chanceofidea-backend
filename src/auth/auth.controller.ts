import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { AuthService } from "./services/Auth.service";
import type { Response, Request } from "express";
import { StartEmailAuthDto } from "../dto/StartEmailAuth.dto";
import { FinishEmailAuthDto } from "../dto/FinishEmailAuth.dto";

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
    const refresh = req.cookies?.refresh;
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

  @Post("email/start")
  async startEmailAuth(@Body() dto: StartEmailAuthDto) {
    await this.authService.startEmailAuth(dto.email);
  }

  @Post("email/finish")
  async finishEmailAuth(
    @Body() dto: FinishEmailAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const jwt = await this.authService.finishEmailAuth({
      code: dto.code,
      email: dto.email,
    });

    res.set({ "x-access-token": jwt.access });

    res.cookie("refresh", jwt.refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }
}
