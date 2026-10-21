import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { GithubService } from "./services/Github.service";
import { GithubRepositoryDto } from "../dto/GithubRepository.dto";
import { ApiResponse } from "@nestjs/swagger";

@Controller("github")
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(AuthGuard)
  @Get("repositories")
  @ApiResponse({
    status: 200,
    type: GithubRepositoryDto,
    description: "A list of that",
  })
  async fetchRepos(
    @Req() req: IRequestWithRefresh,
  ): Promise<GithubRepositoryDto[]> {
    return await this.githubService.fetchRepositories(req.user.id);
  }
}
