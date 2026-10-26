import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { UserEntity } from "../../user/entities/User.entity";
import { TransferSessionStatusEnum } from "../../enums/TransferSessionStatusEnum.status";

@Entity()
export class TransferSessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @JoinColumn()
  @ManyToOne(() => ProjectEntity, {
    onDelete: "SET NULL",
  })
  project: ProjectEntity;

  @JoinColumn()
  @ManyToOne(() => UserEntity, {
    onDelete: "SET NULL",
  })
  applicant: UserEntity;

  @Column({
    type: "enum",
    enum: TransferSessionStatusEnum,
    default: TransferSessionStatusEnum.ACTIVE,
  })
  status: TransferSessionStatusEnum;

  @CreateDateColumn()
  createdAt: Date;
}
