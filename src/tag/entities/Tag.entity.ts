import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProjectEntity } from "../../project/entities/Project.entity";

@Entity()
export class TagEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, update: false })
  name: string;

  @Column({ unique: true, update: false })
  slug: string;

  @ManyToMany(() => ProjectEntity, (projects) => projects.tags)
  projects: ProjectEntity[];
}
