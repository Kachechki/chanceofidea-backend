import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { ApplicationStatusEnum } from "../../enums/ApplicationStatus.enum";

@Entity()
export class ApplicationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.applications)
  @JoinColumn()
  applicant: UserEntity;

  @ManyToOne(() => ProjectEntity, (project) => project.applications)
  @JoinColumn()
  project: ProjectEntity;

  @Column()
  whyMe: string;

  @Column({ nullable: true })
  plan: string;

  @Column({ nullable: true })
  portflioUrl: string;

  @Column({ type: "enum", enum: ApplicationStatusEnum })
  status: ApplicationStatusEnum;

  @Column({ nullable: true })
  rejectReason: string;

  @Column({ type: "timestamptz" })
  createdAt: Date;

  @Column({ type: "timestamptz" })
  updatedAt: Date;
}
