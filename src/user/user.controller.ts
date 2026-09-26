import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { UserService } from "./services/User.service";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@Req() req: IRequestWithRefresh) {
    const user = await this.userService.findById(req.user.id);

    return {
      id: user.id,
      bio: user.bio,
      login: user.login,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl,
    };
  }
}
