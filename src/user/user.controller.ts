import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { UserService } from "./services/User.service";
import { UserDto } from "../dto/User.dto";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get("me")
  @ApiOperation({
    summary: "Get the authenticated user's profile",
  })
  @ApiOkResponse({
    description: "User profile retrieved successfully",
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "User not found",
  })
  async me(@Req() req: IRequestWithRefresh): Promise<UserDto> {
    const user = await this.userService.findById(req.user.id, {
      projects: true,
    });

    return {
      id: user.id,
      bio: user.bio,
      login: user.login,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl,
      projects: user.projects,
    };
  }
}
