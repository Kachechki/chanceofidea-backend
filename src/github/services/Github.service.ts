import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Octokit } from "octokit";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

import { IGithubRepository } from "../../types/GithubRepository.interface";
import { IValidateRepositroy } from "../../types/ValidateRepository.interace";
import { UserService } from "../../user/services/User.service";
import { GithubAccessService } from "../../auth/services/GithubAccess.service";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";

interface IGithubService {
  fetchRepositories(ownerId: string): Promise<IGithubRepository[]>;
  startGithubHandover(transferSessionId: string): Promise<void>;
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

  private createOctokit(accessToken: string): Octokit {
    return new Octokit({
      auth: accessToken,
    });
  }

  async fetchRepositories(ownerId: string): Promise<IGithubRepository[]> {
    const owner = await this.userService.findById(ownerId);
    const accessToken = await this.githubAccessService.get(owner);
    const octokit = this.createOctokit(accessToken);

    return octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      affiliation: "owner",
      per_page: 100,
    }) as Promise<IGithubRepository[]>;
  }

  @OnEvent("application.accepted")
  async startGithubHandover(transferSessionId: string): Promise<void> {
    const transferSession = await this.transferSessionService.findById(
      transferSessionId,
      {
        project: {
          owner: {
            githubAccessToken: true,
          },
        },
        applicant: true,
      },
    );

    const owner = transferSession.project.owner;
    const applicant = transferSession.applicant;

    const accessToken = await this.githubAccessService.get(owner);

    const octokit = this.createOctokit(accessToken);

    try {
      await octokit.rest.repos.transfer({
        owner: owner.login,
        repo: transferSession.project.repositoryName,
        new_owner: applicant.login,
      });

      transferSession.project.status = ProjectStatusEnum.TRANSFERRING;
    } catch (error) {
      this.eventEmitter.emit("transfer.termiated", {
        transferSessionId,
        failed: true,
      });

      throw error;
    }
  }

  async validateRepositry(data: IValidateRepositroy): Promise<boolean> {
    const octokit = new Octokit();

    try {
      await octokit.rest.repos.get({
        owner: data.ownerLogin,
        repo: data.repositoryName,
      });

      return true;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 404
      ) {
        return false;
      }

      throw error;
    }
  }

  @OnEvent("transfer.success")
  async finishGithubHandover(transferSessionId: string): Promise<void> {
    const transferSession = await this.transferSessionService.findById(
      transferSessionId,
      {
        project: {
          owner: true,
        },
        applicant: {
          githubAccessToken: true,
        },
      },
    );

    const project = transferSession.project;
    const previousOwner = project.owner;
    const newOwner = transferSession.applicant;

    const text = `
# Repository Transfer Record

This document serves as an official record of the repository transfer facilitated by Chance of Idea.

## Transfer Details

- **Project Title:** ${project.title}
- **Previous Owner:** @${previousOwner.login}
- **New Owner:** @${newOwner.login}
- **Transfer Date:** ${transferSession.createdAt}
- **Transfer Status:** Completed

## Transfer Statement

The ownership of the repository identified above has been transferred from **${previousOwner.login}** to **${newOwner.login}** through the Chance of Idea platform.

The transfer process has been completed, and repository ownership is now assigned to the receiving party, subject to GitHub's applicable terms and conditions.

## Project Information

- **Description:** ${project.description}
- **Readiness:** ${project.readiness}

## Record of Completion

This document was generated automatically upon confirmation of the successful repository transfer.

**Issuing Platform:** Chance of Idea  
**Record Type:** Repository Ownership Transfer
`;

    try {
      const accessToken = await this.githubAccessService.get(newOwner);

      const octokit = this.createOctokit(accessToken);

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: newOwner.login,
        repo: project.repositoryName,
        path: "TRANSFER.md",
        message:
          "Create TRANSFER.md after repository transfer (by Chance of Idea team)",
        content: Buffer.from(text, "utf8").toString("base64"),
      });
    } catch (error) {
      this.eventEmitter.emit("transfer.termiated", {
        transferSessionId,
        failed: true,
      });

      return;
    }

    this.eventEmitter.emit("transfer.finished", {
      transferSessionId,
    });
  }
}
