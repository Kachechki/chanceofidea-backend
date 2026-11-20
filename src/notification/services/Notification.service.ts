import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ICreateNotification } from "../../types/CreateNotification.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationEntity } from "../entites/Notification.entity";
import { Repository } from "typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { type ITransferResultsPayload } from "../../types/TransferResultsPayload.interface";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";
import { NotificationTypeEnum } from "../../enums/NotificationType.enum";

interface INotifiactionService {
  create(data: ICreateNotification): Promise<string>;
  delete(id: string, userId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  fetchAll(userId: string): Promise<NotificationEntity[]>;
}

@Injectable()
export class NotifiactionService implements INotifiactionService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
    @Inject(forwardRef(() => TransferSessionService))
    private readonly transferSessionService: TransferSessionService,
  ) {}

  async create(data: ICreateNotification): Promise<string> {
    return (
      await this.repository.save({
        topic: data.topic,
        body: data.body,
        type: data.type,
        user: { id: data.recieverId },
      })
    ).id;
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.repository.delete({ id, user: { id: userId } });

    if (!result.affected) throw new NotFoundException("Notification not found");
  }

  async deleteAll(userId: string): Promise<void> {
    await this.repository.delete({ user: { id: userId } });
  }

  async fetchAll(userId: string): Promise<NotificationEntity[]> {
    return await this.repository.findBy({ user: { id: userId } });
  }

  @OnEvent("transfer.terminated")
  private async transferTerminatedHandler(
    payload: ITransferResultsPayload,
  ): Promise<void> {
    const transferSession = await this.transferSessionService.findById(
      payload.transferSessionId,
      {
        project: { owner: true },
        applicant: true,
      },
    );

    if (payload.failed) {
      const data = {
        topic: "Transfer has failed",
        body: `Oh no! Transfer of ${transferSession.project.repositoryName} has failed.`,
        type: NotificationTypeEnum.TRANSFER_FAILED,
      };
      await this.create({
        ...data,
        recieverId: transferSession.applicant.id,
      });

      await this.create({
        ...data,
        recieverId: transferSession.project.owner.id,
      });
    } else {
      const data = {
        topic: "Transfer was canceled",
        body: `Transfer of ${transferSession.project.repositoryName} was canceled.`,
        type: NotificationTypeEnum.TRANSFER_CANCELED,
      };

      await this.create({
        ...data,
        recieverId: transferSession.applicant.id,
      });

      await this.create({
        ...data,
        recieverId: transferSession.project.owner.id,
      });
    }
  }

  @OnEvent("transfer.finished")
  private async transferFinishedHandler(payload: ITransferResultsPayload) {
    const transferSession = await this.transferSessionService.findById(
      payload.transferSessionId,
    );

    const data = {
      topic: "Transfer results",
      type: NotificationTypeEnum.TRANSFER_COMPLETED,
    };

    await this.create({
      ...data,
      body: `Transfer has successfuly been finished! Hop on to <a href="https://github.com/${transferSession.applicant.login}/${transferSession.project.repositoryName}">github</a> to view your new repository.`,
      recieverId: transferSession.applicant.id,
    });

    await this.create({
      ...data,
      body: `Transfer has successfuly been finished! Hop on to github to verify that you don't own ${transferSession.project.repositoryName} anymore.`,
      recieverId: transferSession.project.owner.id,
    });
  }
}
