import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import { Injectable } from "@nestjs/common";

interface IAuthService {
  authenticate(code: string): Promise<void>;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private  configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async authenticate(code: string): Promise<void> {
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

    await this.userService.save({
      avatarUrl: profileData.avatar_url,
      login: profileData.login,
      githubId: profileData.id,
    });
  }
}
