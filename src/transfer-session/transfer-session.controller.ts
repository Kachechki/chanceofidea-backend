import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { TransferSessionService } from "./services/TransferSession.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";

@ApiTags("Transfer Sessions")
@ApiBearerAuth()
@Controller("transfer-session")
export class TransferSessionController {
  constructor(
    private readonly transferSessionService: TransferSessionService,
  ) {}

  @Post("i-have-recieved")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Confirm repository receipt",
    description:
      "Allows the authenticated user to confirm that they have received the repository.",
  })
  @ApiOkResponse({
    description: "Repository receipt confirmed successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "No applicable transfer session was found",
  })
  @ApiConflictResponse({
    description:
      "The transfer session is not in a state that allows confirmation",
  })
  async iHaveRecievedTheRepository(
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.transferSessionService.iHaveRecievedTheRepo(req.user.id);
  }

  @Post("i-dont-want")
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Decline repository transfer",
    description:
      "Allows the authenticated user to indicate that they no longer want the repository.",
  })
  @ApiOkResponse({
    description: "Repository transfer declined successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  @ApiNotFoundResponse({
    description: "No applicable transfer session was found",
  })
  @ApiConflictResponse({
    description: "The transfer session cannot be declined in its current state",
  })
  async iDontWantTheRepository(@Req() req: IRequestWithRefresh): Promise<void> {
    await this.transferSessionService.iDontWantTheRepo(req.user.id);
  }
}
