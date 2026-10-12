import { Injectable } from "@nestjs/common";
import { IGithubRepository } from "../../types/GithubRepository.interface";
import { UserService } from "../../user/services/User.service";
import { GithubAccessService } from "../../auth/services/GithubAccess.service";

interface IGithubService {
  fetchRepositories(ownerId: string): Promise<IGithubRepository[]>;
}

@Injectable()
export class GithubService implements IGithubService {
  constructor(
    private readonly userService: UserService,
    private readonly githubAccessService: GithubAccessService,
  ) {}

  async fetchRepositories(ownerId: string): Promise<IGithubRepository[]> {
    const owner = await this.userService.findById(ownerId);
    const githubAccessToken = await this.githubAccessService.get(owner);

    const repositories = [];

    for (let page = 1; ; page++) {
      const response = await fetch(
        `https://api.github.com/user/repos?affiliation=owner&per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${githubAccessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2026-03-10",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const batch = await response.json();
      repositories.push(...batch);

      if (batch.length < 100) break;
    }

    return repositories;
  }
}
