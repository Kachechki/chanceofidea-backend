import { Request } from "express";

export interface IRequestWithRefresh extends Request {
  cookies: {
    refresh?: string;
  };
  headers: {
    authorization?: string;
  };
  user: { id: string };
}
