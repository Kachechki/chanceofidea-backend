import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IJwtPayload } from "../../types/JwtPayload.interface";
import { IJwtPair } from "../../types/JwtPair.interface";
import { UserService } from "../../user/services/User.service";
interface IJwtTokenService {
    sign(payload: IJwtPayload): IJwtPair;
    validateAccess(access: string): IJwtPayload;
    validateRefresh(refresh: string): IJwtPayload;
    refresh(refresh: string): Promise<IJwtPair>;
}
export declare class JwtTokenService implements IJwtTokenService {
    private readonly jwtService;
    private readonly userService;
    private readonly configService;
    private accessSecret;
    private refreshSecret;
    constructor(jwtService: JwtService, userService: UserService, configService: ConfigService);
    sign(payload: IJwtPayload): IJwtPair;
    validateAccess(access: string): IJwtPayload;
    validateRefresh(refresh: string): IJwtPayload;
    refresh(refresh: string): Promise<IJwtPair>;
}
export {};
