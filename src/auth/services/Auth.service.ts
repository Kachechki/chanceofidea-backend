import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import { Injectable } from "@nestjs/common";
import { JwtTokenService } from "./Jwt.service";
import { IJwtPair } from "../../types/JwtPair.interface";

interface IAuthService {
  authenticate(code: string): Promise<IJwtPair>;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtTokenService,
  ) {}

  async authenticate(code: string): Promise<IJwtPair> {
    const accessTokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        body: JSON.stringify({
          client_id: this.configService.getOrThrow("github.clientId"),
          client_secret: this.configService.getOrThrow("github.clientSecret"),
          code,
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    ).then((res) => res.json());

    const profileData = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessTokenRes.access_token}`,
        Accept: "application/json",
      },
    }).then((res) => res.json());

    const userId = await this.userService.save({
      avatarUrl: profileData.avatar_url,
      login: profileData.login,
      githubId: profileData.id,
    });

    return await this.jwtService.sign({ id: userId });
  }
}
