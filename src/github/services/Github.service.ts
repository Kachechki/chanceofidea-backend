import {
  forwardRef,
  Inject,
  Injectable,
} from "@nestjs/common";
import { IGithubRepository } from "../../types/GithubRepository.interface";
import { UserService } from "../../user/services/User.service";
import { GithubAccessService } from "../../auth/services/GithubAccess.service";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";
import { IValidateRepositroy } from "../../types/ValidateRepository.interace";

interface IGithubService {
  fetchRepositories(ownerId: string): Promise<IGithubRepository[]>;
  startGithubHandover(applicantId: string): Promise<void>;
  validateRepositry(data: IValidateRepositroy): Promise<boolean>;
  finishGithubHandover(transferSessionId: string): Promise<void>;
}

@Injectable()
export class GithubService implements IGithubService {
  constructor(
    private readonly userService: UserService,
    private readonly githubAccessService: GithubAccessService,
    @Inject(forwardRef(() => TransferSessionService))
    private readonly transferSessionService: TransferSessionService,
    private readonly eventEmitter: EventEmitter2,
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

  @OnEvent("application.accepted")
  async startGithubHandover(transferSessionId: string): Promise<void> {
    const transferSession = await this.transferSessionService.findById(
      transferSessionId,
      { project: { owner: { githubAccessToken: true } }, applicant: true },
    );

    const accessToken =
      transferSession.project.owner.githubAccessToken.githubAccessToken;
    const ownerGithub = transferSession.project.owner.login;
    const githubRepo = transferSession.project.repositoryName;
    const newOwner = transferSession.applicant.login;

    const res = await fetch(
      `https://api.github.com/repos/${ownerGithub}/${githubRepo}/transfer`,
      {
        method: "POST",
        body: JSON.stringify({ new_owner: newOwner }),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-Github-Api-Version": "2026-03-10",
        },
      },
    );

    const project = transferSession.project;
    project.status = ProjectStatusEnum.TRANSFERRING;

    if (!res.ok) {
      this.eventEmitter.emit("transfer.termiated", {
        transferSessionId,
        failed: true,
      });

      throw new Error(`Github API error: ${res.status}`);
    }
  }

  async validateRepositry(data: IValidateRepositroy): Promise<boolean> {
    const res = await fetch(
      `https://api.github.com/repos/${data.ownerLogin}/${data.repositoryName}`,
    );

    return res.ok;
  }

  @OnEvent("transfer.success")
  async finishGithubHandover(transferSessionId: string): Promise<void> {
    const transferSession =
      await this.transferSessionService.findById(transferSessionId);

    // create TRANSFER.md
    const text = `
# Repository Transfer Record

This document serves as an official record of the repository transfer facilitated by Chance of Idea.

## Transfer Details

- **Project Title:** ${transferSession.project.title}
- **Previous Owner:** @${transferSession.project.owner.login}
- **New Owner:** @${transferSession.applicant.login}
- **Transfer Date:** ${transferSession.createdAt}
- **Transfer Status:** Completed

## Transfer Statement

The ownership of the repository identified above has been transferred from **${transferSession.project.owner.login}** to **${transferSession.applicant.login}** through the Chance of Idea platform.

The transfer process has been completed, and repository ownership is now assigned to the receiving party, subject to GitHub's applicable terms and conditions.

## Project Information

- **Description:** ${transferSession.project.description}
- **Readiness:** ${transferSession.project.readiness}

## Record of Completion

This document was generated automatically upon confirmation of the successful repository transfer.

**Issuing Platform:** Chance of Idea  
**Record Type:** Repository Ownership Transfer  
`;

    const res = await fetch(
      `https://api.github.com/repos/${transferSession.applicant.login}/${transferSession.project.repositoryName}/contents/TRANSFER.md`,
      {
        body: JSON.stringify({
          message:
            "Create TRANSFER.md after repository transfer (by Chance of Idea team)",
          content: Buffer.from(text, "utf-8").toString("base64"),
        }),
      },
    );

    if (!res.ok) {
      this.eventEmitter.emit("transfer.termiated", {
        transferSessionId,
        failed: true,
      });
      return;
    }

    this.eventEmitter.emit("transfer.finished", { transferSessionId });
  }
}
