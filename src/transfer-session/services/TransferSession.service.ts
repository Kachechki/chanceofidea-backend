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

interface ITransferSessionService {
  findById(
    id: string,
    relations: FindOptionsRelations<TransferSessionEntity>,
  ): Promise<TransferSessionEntity>;
  save(data: IUpdateTransferSession): Promise<void>;
  handleTransferTerminated(payload: ITransferResultsPayload): Promise<void>;
  handleTransferSuccess(payload: ITransferResultsPayload): Promise<void>;
  iHaveRecievedTheRepo(userId: string): Promise<void>;
  iDontWantTheRepo(userId: string): Promise<void>;
}

@Injectable()
export class TransferSessionService implements ITransferSessionService {
  constructor(
    @InjectRepository(TransferSessionEntity)
    private readonly repository: Repository<TransferSessionEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UserService,
    private readonly githubService: GithubService,
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
    const transferSession = await this.findById(payload.transferSessionId);

    transferSession.status = TransferSessionStatusEnum.FINISHED;

    await this.repository.save(transferSession);
  }

  async iHaveRecievedTheRepo(userId: string): Promise<void> {
    const applicant = await this.userService.findById(userId);

    const transferSession = await this.repository.findOne({
      where: { applicant: { id: applicant.id } },
      relations: {
        project: true,
      },
    });
    if (!transferSession)
      throw new NotFoundException("Transfer session not found");

    if (
      !(await this.githubService.validateRepositry({
        ownerLogin: applicant.login,
        repositoryName: transferSession.project.repositoryName,
      }))
    ) {
      await this.eventEmitter.emit("transfer.terminated", {
        transferSessionId: transferSession.id,
        failed: false,
      });

      throw new NotAcceptableException(
        "You have not yet accepted the repository transfer",
      );
    }

    this.eventEmitter.emit("transfer.success", {
      transferSessionId: transferSession.id,
    });
  }

  async iDontWantTheRepo(userId: string): Promise<void> {
    const applicant = await this.userService.findById(userId);
    const transferSession = await this.repository.findOne({
      where: { applicant: { id: applicant.id } },
      relations: { project: true },
    });
    if (!transferSession)
      throw new NotFoundException("Transfer session not found");

    if (
      await this.githubService.validateRepositry({
        ownerLogin: applicant.login,
        repositoryName: transferSession.project.repositoryName,
      })
    ) {
      this.eventEmitter.emit("transfer.success", {
        transferSessionid: transferSession.id,
      });

      throw new NotAcceptableException(
        "You have actually accepted the repository transfer",
      );
    }

    this.eventEmitter.emit("transfer.terminated", {
      transferSessionId: transferSession.id,
      failed: false,
    });
  }
}
