import { Injectable, UnauthorizedException } from "@nestjs/common";
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

@Injectable()
export class JwtTokenService implements IJwtTokenService {
  private accessSecret: string;
  private refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.configService.getOrThrow("jwt.accessSecret");
    this.refreshSecret = this.configService.getOrThrow("jwt.refreshSecret");
  }

  sign(payload: IJwtPayload): IJwtPair {
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

  validateAccess(access: string): IJwtPayload {
    try {
      return this.jwtService.verify(access, {
        secret: this.accessSecret,
      });
    } catch {
      throw new UnauthorizedException("Token has been expiredor revoked.");
    }
  }

  validateRefresh(refresh: string): IJwtPayload {
    try {
      return this.jwtService.verify(refresh, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Token has been expired or revoked.");
    }
  }

  async refresh(refresh: string): Promise<IJwtPair> {
    const decode = this.validateRefresh(refresh);

    const updatedUser = await this.userService.findById(decode.id);
    if (!updatedUser) throw new UnauthorizedException("Invalid refresh token");

    return this.sign({
      id: updatedUser.id,
    });
  }
}
