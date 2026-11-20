import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { GithubAccessEntity } from "../../auth/entities/GithubAccess.entity";
import { ApplicationEntity } from "../../application/entities/Application.entity";
import { SettingsEntity } from "../../settings/entities/Settings.entity";
import { NotificationEntity } from "../../notification/entites/Notification.entity";
import { ReportEntity } from "../../report/entities/Report.entity";
import { UserRoleEnum } from "../../enum/UserRole.enum";

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, update: false, nullable: true })
  githubId?: number;

  @Column({ unique: true, update: false, nullable: true })
  login?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ default: "" })
  bio: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "boolean" })
  githubVerified: boolean;

  @Column({ type: "boolean", default: false })
  onboardingPassed: boolean;

  @Column({ type: "boolean", default: false })
  hasApprovedReport: boolean;

  @Column({ type: "enum", enum: UserRoleEnum })
  role: UserRoleEnum;

  @OneToMany(() => ProjectEntity, (project) => project.owner, {
    onDelete: "SET NULL",
  })
  projects: ProjectEntity[];

  @JoinColumn()
  @OneToOne(() => GithubAccessEntity, (gae) => gae.user, {
    onDelete: "CASCADE",
    cascade: true,
  })
  githubAccessToken: GithubAccessEntity;

  @OneToMany(() => ApplicationEntity, (applications) => applications.applicant)
  applications: ApplicationEntity[];

  @JoinColumn()
  @OneToOne(() => SettingsEntity, (settings) => settings.user)
  settings: SettingsEntity;

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @OneToMany(() => ReportEntity, (report) => report.writtenBy)
  writtenReports: ReportEntity[];
}
