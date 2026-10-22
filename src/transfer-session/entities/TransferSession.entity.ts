import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
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
  @OneToOne(() => ProjectEntity, {
    onDelete: "SET NULL",
  })
  project: ProjectEntity;

  @JoinColumn()
  @OneToOne(() => UserEntity, {
    onDelete: "SET NULL",
  })
  applicant: UserEntity;

  @Column({
    type: "enum",
    enum: TransferSessionStatusEnum,
    default: TransferSessionStatusEnum.ACTIVE,
  })
  status: TransferSessionStatusEnum;

  @Column({ type: "timestamptz" })
  createdAt: Date;
}
