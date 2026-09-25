import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
interface IAuthService {
    authenticate(code: string): Promise<void>;
}
export declare class AuthService implements IAuthService {
    private configService;
    private readonly userService;
    constructor(configService: ConfigService, userService: UserService);
    authenticate(code: string): Promise<void>;
}
export {};
