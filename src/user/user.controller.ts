import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
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
import { BecomeAdminDto } from "../dto/BecomeAdmin.dto";
import { type Response } from "express";

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
      settings: true,
    });

    return {
      id: user.id,
      bio: user.bio,
      login: user.login ?? undefined,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl,
      projects: user.projects,
      email: user.email ?? undefined,
      settings: user.settings ?? undefined,
      onboardingPassed: user.onboardingPassed,
    };
  }

  @UseGuards(AuthGuard)
  @Post("pass-onboarding")
  @ApiOperation({
    summary: "Mark the authenticated user's onboarding as completed",
    description: "Updates the authenticated user's onboarding status.",
  })
  @ApiNoContentResponse({
    description: "Onboarding marked as completed successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async passOboarding(@Req() req: IRequestWithRefresh): Promise<void> {
    await this.userService.passOnboarding(req.user.id);
  }

  @Post("/become-admin")
  async becomeAdmin(
    @Req() req: IRequestWithRefresh,
    @Body() dto: BecomeAdminDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const jwt = await this.userService.becomeAdmin(req.user.id, dto.code);

    res.set("access", jwt.access);

    res.cookie("refresh", jwt.refresh, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }
}
