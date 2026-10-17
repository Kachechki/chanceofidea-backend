import { Injectable, NotFoundException } from "@nestjs/common";
import { FindOptionsRelations, Repository } from "typeorm";
import { TransferSessionEntity } from "../entities/TransferSession.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { IUpdateTransferSession } from "../../types/UpdateTransferSession.interface";
import { OnEvent } from "@nestjs/event-emitter";
import { TransferSessionStatusEnum } from "../../enums/TransferSessionStatusEnum.status";

interface ITransferSessionService {
  findById(
    id: string,
    relations: FindOptionsRelations<TransferSessionEntity>,
  ): Promise<TransferSessionEntity>;
  save(data: IUpdateTransferSession): Promise<void>;
  handleTransferFailed(transferSessionId: string): Promise<void>;
  handleTransferSuccess(transferSessionId: string): Promise<void>;
}

@Injectable()
export class TransferSessionService implements ITransferSessionService {
  constructor(
    @InjectRepository(TransferSessionEntity)
    private readonly repository: Repository<TransferSessionEntity>,
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
    });
  }

  @OnEvent("transfer.failed")
  async handleTransferFailed(transferSessionId: string): Promise<void> {
    const transferSession = await this.findById(transferSessionId);

    transferSession.status = TransferSessionStatusEnum.FAILED;

    await this.repository.save(transferSession);
  }

  @OnEvent("transfer.success")
  async handleTransferSuccess(transferSessionId: string): Promise<void> {
    const transferSession = await this.findById(transferSessionId)

    transferSession.status = TransferSessionStatusEnum.FINISHED;

    await this.repository.save(transferSession);
  }
}
