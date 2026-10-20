import { TransferSessionStatusEnum } from "../enums/TransferSessionStatusEnum.status";

export interface IUpdateTransferSession {
  id: string;
  status: TransferSessionStatusEnum;
  createdAt?: Date;
}
