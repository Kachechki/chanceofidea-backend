import { Body, Controller, Patch, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from "@nestjs/swagger";

import { SettingsService } from "./services/Settings.service";
import { UdpateSettingsDto } from "../dto/UpdateSettings.dto";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { AuthGuard } from "../auth/guards/Auth.guard";

@ApiTags("Settings")
@ApiBearerAuth()
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(AuthGuard)
  @Patch("update")
  @ApiOperation({
    summary: "Update user settings",
    description: "Updates the authenticated user's preferred locale and theme.",
  })
  @ApiBody({ type: UdpateSettingsDto })
  @ApiOkResponse({
    description: "Settings were successfuly updated.",
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated.",
  })
  @ApiBadRequestResponse({
    description: "Invalid settings data.",
  })
  async update(
    @Body() dto: UdpateSettingsDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.settingsService.update({
      userId: req.user.id,
      prefferedLocale: dto.prefferedLocale,
      theme: dto.theme,
    });
  }
}
