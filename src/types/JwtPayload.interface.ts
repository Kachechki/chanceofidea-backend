import { UserRoleEnum } from "../enum/UserRole.enum";

export interface IJwtPayload {
  id: string;
  githubVerified: boolean;
  role: UserRoleEnum;
}
