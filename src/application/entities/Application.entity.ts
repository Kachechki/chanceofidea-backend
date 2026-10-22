import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { ApplicationStatusEnum } from "../../enums/ApplicationStatus.enum";

@Entity()
export class ApplicationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.applications, {
    onDelete: "CASCADE",
    cascade: true,
  })
  @JoinColumn()
  applicant: UserEntity;

  @ManyToOne(() => ProjectEntity, (project) => project.applications, {
    onDelete: "CASCADE",
    cascade: true,
  })
  @JoinColumn()
  project: ProjectEntity;

  @Column()
  whyMe: string;

  @Column({ nullable: true })
  plan?: string;

  @Column({ nullable: true })
  portflioUrl?: string;

  @Column({ type: "enum", enum: ApplicationStatusEnum })
  status: ApplicationStatusEnum;

  @Column({ nullable: true })
  rejectReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
