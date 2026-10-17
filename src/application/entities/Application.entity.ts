import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";
import { ProjectEntity } from "../../project/entities/Project.entity";

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
  
}
