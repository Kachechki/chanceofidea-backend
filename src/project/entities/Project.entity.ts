import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
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
  repositoryName: string;

  @Column({ type: "timestamptz", update: false })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.projects)
  owner: UserEntity;

  @JoinColumn()
  @ManyToOne(() => CategoryEntity, {
    onDelete: "CASCADE",
    cascade: true,
  })
  category: CategoryEntity;

  @JoinTable()
  @ManyToMany(() => TagEntity, (tags) => tags.projects, {
    onDelete: "CASCADE",
    cascade: true,
  })
  tags: TagEntity[];
}
