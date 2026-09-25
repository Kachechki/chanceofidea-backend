import { AuthService } from "./services/Auth.service";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    oAuthCallback(code: string): Promise<void>;
}
