import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ProjectEntity } from "../../project/entities/Project.entity";

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

  @Column({ type: "timestamptz", update: false })
  createdAt: Date;

  @JoinColumn()
  @ManyToOne(() => ProjectEntity, (project) => project.owner)
  projects: ProjectEntity;
}
