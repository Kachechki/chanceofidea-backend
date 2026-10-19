import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { TransferSessionService } from "./services/TransferSession.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";

@Controller("transfer-session")
export class TransferSessionController {
  constructor(
    private readonly transferSessionService: TransferSessionService,
  ) {}

  @Post("i-have-recieved")
  @UseGuards(AuthGuard)
  async iHaveRecievedTheRepository(@Req() req: IRequestWithRefresh) {
    await this.transferSessionService.iHaveRecievedTheRepo(req.user.id);
  }

  @Post("i-dont-want")
  @UseGuards(AuthGuard)
  async iDontWantTheRepository(@Req() req: IRequestWithRefresh) {
    await this.transferSessionService.iDontWantTheRepo(req.user.id);
  }
}
