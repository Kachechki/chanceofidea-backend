import { AuthService } from "./services/Auth.service";
import { type Response } from "express";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    oAuthCallback(code: string, res: Response): Promise<void>;
}
