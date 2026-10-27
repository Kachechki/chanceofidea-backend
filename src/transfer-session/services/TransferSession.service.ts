import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { FindOptionsRelations, Repository } from "typeorm";
import { TransferSessionEntity } from "../entities/TransferSession.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IUpdateTransferSession } from "../../types/UpdateTransferSession.interface";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { TransferSessionStatusEnum } from "../../enums/TransferSessionStatusEnum.status";
import { UserService } from "../../user/services/User.service";
import { GithubService } from "../../github/services/Github.service";
import { type ITransferResultsPayload } from "../../types/TransferResultsPayload.interface";
import { ApplicationService } from "../../application/services/Application.service";

interface ITransferSessionService {
  findById(
    id: string,
    relations: FindOptionsRelations<TransferSessionEntity>,
  ): Promise<TransferSessionEntity>;
  save(data: IUpdateTransferSession): Promise<void>;
  handleTransferTerminated(payload: ITransferResultsPayload): Promise<void>;
  handleTransferSuccess(payload: ITransferResultsPayload): Promise<void>;
  iHaveRecievedTheRepo(userId: string, applicationId: string): Promise<void>;
  iDontWantTheRepo(userId: string, applicationId: string): Promise<void>;
}

@Injectable()
export class TransferSessionService implements ITransferSessionService {
  constructor(
    @InjectRepository(TransferSessionEntity)
    private readonly repository: Repository<TransferSessionEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    private readonly githubService: GithubService,
    private readonly applicationService: ApplicationService,
  ) {}

  async findById(
    id: string,
    relations?: FindOptionsRelations<TransferSessionEntity>,
  ): Promise<TransferSessionEntity> {
    const transferSession = await this.repository.findOne({
      where: { id },
      relations,
    });
    if (!transferSession)
      throw new NotFoundException("Transfer session not found");

    return transferSession;
  }

  async save(data: IUpdateTransferSession): Promise<void> {
    await this.repository.save({
      id: data.id,
      status: data.status,
      createdAt: data.createdAt,
    });
  }

  @OnEvent("transfer.terminated")
  async handleTransferTerminated(
    payload: ITransferResultsPayload,
  ): Promise<void> {
    const transferSession = await this.findById(payload.transferSessionId);

    if (payload.failed)
      transferSession.status = TransferSessionStatusEnum.FAILED;
    else transferSession.status = TransferSessionStatusEnum.CANCELED;

    await this.repository.save(transferSession);
  }

  @OnEvent("transfer.finished")
  async handleTransferSuccess(payload: ITransferResultsPayload): Promise<void> {
    const transferSession = await this.findById(payload.transferSessionId, {
      applicant: true,
      project: true,
    });
    console.log("\n\n");
    console.log(transferSession);

    transferSession.status = TransferSessionStatusEnum.FINISHED;
    console.log("Changing transfer session status");

    await this.repository.save(transferSession);
  }

  async iHaveRecievedTheRepo(
    userId: string,
    applicationId: string,
  ): Promise<void> {
    const applicant = await this.userService.findById(userId);

    const application = await this.applicationService.findById(applicationId, {
      project: true,
      applicant: true,
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const transferSession = await this.repository.findOne({
      where: {
        project: { id: application.project.id },
        applicant: { id: application.applicant.id },
      },
      relations: {
        project: true,
        applicant: true,
      },
    });
    if (!transferSession)
      throw new NotFoundException("Transfer session not found");

    if (transferSession.applicant.id !== applicant.id)
      throw new NotAcceptableException(
        "Not allowed to decide for someone else",
      );

    if (
      !(await this.githubService.validateRepositry({
        ownerLogin: applicant.login,
        repositoryName: transferSession.project.repositoryName,
      }))
    ) {
      await this.eventEmitter.emitAsync("transfer.terminated", {
        transferSessionId: transferSession.id,
        failed: false,
      });

      throw new NotAcceptableException(
        "You have not yet accepted the repository transfer",
      );
    }

    await this.eventEmitter.emitAsync("transfer.success", {
      transferSessionId: transferSession.id,
    });
  }

  async iDontWantTheRepo(userId: string, applicationId: string): Promise<void> {
    const applicant = await this.userService.findById(userId);
    const transferSession = await this.repository.findOne({
      where: { applicant: { applications: { id: applicationId } } },
      relations: { project: true, applicant: true },
    });
    if (!transferSession)
      throw new NotFoundException("Transfer session not found");

    if (transferSession.applicant.id !== applicant.id)
      throw new NotAcceptableException(
        "Not allowed to decide for someone else",
      );

    if (
      await this.githubService.validateRepositry({
        ownerLogin: applicant.login,
        repositoryName: transferSession.project.repositoryName,
      })
    ) {
      await this.eventEmitter.emitAsync("transfer.success", {
        transferSessionId: transferSession.id,
      });

      throw new NotAcceptableException(
        "You have actually accepted the repository transfer",
      );
    }

    await this.eventEmitter.emitAsync("transfer.terminated", {
      transferSessionId: transferSession.id,
      failed: false,
    });
  }
}
