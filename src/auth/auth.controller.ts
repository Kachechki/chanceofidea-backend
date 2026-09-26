import { Controller, Get, Query, Res } from "@nestjs/common";
import { AuthService } from "./services/Auth.service";
import { type Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("oauth_callback")
  async oAuthCallback(
    @Query("code") code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const jwtPair = await this.authService.authenticate(code);

    res.set({ access: jwtPair.access, refresh: jwtPair.refresh });
  }
}
