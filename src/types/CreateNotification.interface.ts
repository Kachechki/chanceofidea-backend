import { NotificationTypeEnum } from "../enum/NotificationType.enum";

export interface ICreateNotification {
  topic: string;
  body: string;
  type: NotificationTypeEnum;
  recieverId: string;
}
