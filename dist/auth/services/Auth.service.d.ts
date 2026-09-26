import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import { JwtTokenService } from "./Jwt.service";
import { IJwtPair } from "../../types/JwtPair.interface";
interface IAuthService {
    authenticate(code: string): Promise<IJwtPair>;
}
export declare class AuthService implements IAuthService {
    private configService;
    private readonly userService;
    private readonly jwtService;
    constructor(configService: ConfigService, userService: UserService, jwtService: JwtTokenService);
    authenticate(code: string): Promise<IJwtPair>;
}
export {};
