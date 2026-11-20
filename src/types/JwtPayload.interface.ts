import { UserRoleEnum } from "../enums/UserRole.enum";

export interface IJwtPayload {
  id: string;
  githubVerified: boolean;
  role: UserRoleEnum;
}
