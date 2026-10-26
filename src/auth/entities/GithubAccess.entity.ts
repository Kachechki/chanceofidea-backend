import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";

@Entity()
export class GithubAccessEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  githubAccessToken: string;

  @OneToOne(() => UserEntity, (user) => user.githubAccessToken)
  user: UserEntity;
}
