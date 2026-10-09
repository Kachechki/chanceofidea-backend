import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";
import { CategoryEntity } from "../../category/entities/Category.entity";
import { TagEntity } from "../../tag/entities/Tag.entity";

@Entity()
export class ProjectEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "enum", enum: ProjectStatusEnum })
  status: ProjectStatusEnum;

  @Column({ type: "float" })
  readiness?: number;

  @Column()
  description: string;

  @Column({ update: false })
  repositoryId: number;

  @Column({ update: false })
  repostoryUrl: string;

  @Column({ type: "timestamptz", update: false })
  createdAt: Date;

  @OneToMany(() => UserEntity, (user) => user.projects)
  owner: UserEntity;

  @JoinColumn()
  @ManyToOne(() => CategoryEntity)
  category: CategoryEntity;

  @ManyToMany(() => TagEntity, (tags) => tags.projects)
  tags: TagEntity[];
}
