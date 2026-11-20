import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProjectEntity } from "../../project/entities/Project.entity";
import { UserEntity } from "../../user/entities/User.entity";

@Entity()
export class ReportEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ type: "boolean", nullable: true })
  approved?: boolean;

  @ManyToOne(() => ProjectEntity, (project) => project.reports)
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, (user) => user.writtenReports)
  writtenBy: UserEntity;
}
