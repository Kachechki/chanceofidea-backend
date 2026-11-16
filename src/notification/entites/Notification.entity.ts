import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { NotificationTypeEnum } from "../../enum/NotificationType.enum";
import { UserEntity } from "../../user/entities/User.entity";

@Entity()
export class NotificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  topic: string;

  @Column()
  body: string;

  @Column({ type: "enum", enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @JoinColumn()
  @ManyToOne(() => UserEntity, (user) => user.notifications)
  user: UserEntity;
}
