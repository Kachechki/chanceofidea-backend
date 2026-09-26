"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const User_service_1 = require("../../user/services/User.service");
let JwtTokenService = class JwtTokenService {
    jwtService;
    userService;
    configService;
    accessSecret;
    refreshSecret;
    constructor(jwtService, userService, configService) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.configService = configService;
        this.accessSecret = this.configService.getOrThrow("jwt.accessSecret");
        this.refreshSecret = this.configService.getOrThrow("jwt.refreshSecret");
    }
    sign(payload) {
        const access = this.jwtService.sign(payload, {
            expiresIn: "15m",
            secret: this.accessSecret,
        });
        const refresh = this.jwtService.sign(payload, {
            expiresIn: "5d",
            secret: this.refreshSecret,
        });
        return { access, refresh };
    }
    validateAccess(access) {
        try {
            return this.jwtService.verify(access, {
                secret: this.accessSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException("Token has been expiredor revoked.");
        }
    }
    validateRefresh(refresh) {
        try {
            return this.jwtService.verify(refresh, {
                secret: this.refreshSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException("Token has been expired or revoked.");
        }
    }
    async refresh(refresh) {
        const decode = this.validateRefresh(refresh);
        const updatedUser = await this.userService.findById(decode.id);
        if (!updatedUser)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        return this.sign({
            id: updatedUser.id,
        });
    }
};
exports.JwtTokenService = JwtTokenService;
exports.JwtTokenService = JwtTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        User_service_1.UserService,
        config_1.ConfigService])
], JwtTokenService);
//# sourceMappingURL=Jwt.service.js.map