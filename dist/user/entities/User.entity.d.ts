import { ProjectEntity } from "../../project/entities/Project.entity";
export declare class UserEntity {
    id: string;
    githubId: number;
    login: string;
    avatarUrl: string;
    bio: string;
    createdAt: Date;
    projects: ProjectEntity;
}
