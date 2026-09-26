import { CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtTokenService } from "../services/Jwt.service";
export declare class AuthGuard implements CanActivate {
    private readonly jwtService;
    constructor(jwtService: JwtTokenService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private useAccess;
    private useRefresh;
}
