import { Request } from "express";
import { UserRoleEnum } from "../enums/UserRole.enum";

export interface IRequestWithRefresh extends Request {
  cookies: {
    refresh?: string;
  };
  headers: {
    authorization?: string;
  };
  user: { id: string; githubVerified: boolean; role: UserRoleEnum };
}
