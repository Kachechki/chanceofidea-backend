import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Octokit } from "octokit";
import { JwtTokenService } from "./Jwt.service";
import { IJwtPair } from "../../types/JwtPair.interface";
import { GithubAccessService } from "./GithubAccess.service";
import { error } from "console";

interface IAuthService {
  authenticate(code: string): Promise<IJwtPair>;
  refresh(refresh: string): Promise<IJwtPair>;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtTokenService,
    private readonly githubAccessService: GithubAccessService,
  ) {}

  async authenticate(code: string): Promise<IJwtPair> {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: this.configService.getOrThrow<string>("github.clientId"),
          client_secret: this.configService.getOrThrow<string>(
            "github.clientSecret",
          ),
          code,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new UnauthorizedException("GitHub authentication failed");
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new UnauthorizedException("GitHub did not return an access token");
    }

    const octokit = new Octokit({
      auth: tokenData.access_token,
    });

    const { data: profile } = await octokit.rest.users.getAuthenticated();

    const userId = await this.userService.save({
      avatarUrl: profile.avatar_url,
      login: profile.login,
      githubId: profile.id,
    });

    await this.githubAccessService.save({
      accessToken: tokenData.access_token,
      userId,
    });

    return this.jwtService.sign({ id: userId });
  }

  async refresh(refresh: string): Promise<IJwtPair> {
    return await this.jwtService.refresh(refresh);
  }
}
