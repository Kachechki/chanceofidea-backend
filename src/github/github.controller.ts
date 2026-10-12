import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { GithubService } from "./services/Github.service";

@Controller("github")
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(AuthGuard)
  @Get("repositories")
  async fetchRepos(@Req() req: IRequestWithRefresh) {
    return await this.githubService.fetchRepositories(req.user.id);
  }
}
