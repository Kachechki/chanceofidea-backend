import { UserEntity } from "../user/entities/User.entity";

export interface ICreateProject {
  title: string;
  readiness: number;
  description: string;
  repositoryId: number;
  repositoryUrl: string;
  ownerId: string;
  categoryId: string;
  tags: string[];
  publish: boolean;
}
