import { Controller, Get, Query } from "@nestjs/common";
import { AuthService } from "./services/Auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("oauth_callback")
  async oAuthCallback(@Query("code") code: string) {
    await this.authService.authenticate(code);
  }
}
