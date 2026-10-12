import { Entity, OneToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "../../user/entities/User.entity";

@Entity()
export class GithubAccessEntity {
    @PrimaryColumn()
    githubAccessToken: string;

    @OneToOne(() => UserEntity, (user) => user.githubAccessToken)
    user: UserEntity
}