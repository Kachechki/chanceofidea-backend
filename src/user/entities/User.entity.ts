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

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, update: false })
  githubId: number;

  @Column({ unique: true, update: false })
  login: string;

  @Column()
  avatarUrl: string;

  @Column({ default: "" })
  bio: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @JoinColumn()
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
}
