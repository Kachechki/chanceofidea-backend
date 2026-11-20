import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/services/User.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Octokit } from "octokit";
import { JwtTokenService } from "./Jwt.service";
import { IJwtPair } from "../../types/JwtPair.interface";
import { GithubAccessService } from "./GithubAccess.service";
import { MailService } from "../../mail/services/Mail.service";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { RedisService } from "../../redis/services/Redis.service";
import { IFinishEmailAuthData } from "../../types/FinishEmailAuthData.interface";
import { SettingsService } from "../../settings/services/Settings.service";
import { UserRoleEnum } from "../../enum/UserRole.enum";

interface IAuthService {
  authenticate(code: string): Promise<IJwtPair>;
  refresh(refresh: string): Promise<IJwtPair>;
  startEmailAuth(email: string): Promise<void>;
  finishEmailAuth(data: IFinishEmailAuthData): Promise<IJwtPair>;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtTokenService,
    private readonly githubAccessService: GithubAccessService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly settingsService: SettingsService,
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

    let existingUserId;
    if (profile.email) {
      try {
        const existingUser = await this.userService.findByEmail(profile.email);
        existingUserId = existingUser.id;
      } catch (err) {
        if (err! instanceof NotFoundException) throw err;
      }
    }

    const settingsId = await this.settingsService.createDefault();

    const userId = await this.userService.save({
      id: existingUserId ?? undefined,
      avatarUrl: profile.avatar_url,
      login: profile.login,
      githubId: profile.id,
      githubVerified: true,
      settingsId,
    });

    await this.githubAccessService.save({
      accessToken: tokenData.access_token,
      userId,
    });

    return this.jwtService.sign({
      id: userId,
      githubVerified: true,
      role: UserRoleEnum.USER,
    });
  }

  async refresh(refresh: string): Promise<IJwtPair> {
    return await this.jwtService.refresh(refresh);
  }

  async startEmailAuth(email: string): Promise<void> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

    const hmac = createHmac(
      "sha256",
      this.configService.getOrThrow<string>("mail.verificationSecret"),
    )
      .update(code)
      .digest("hex");

    await this.redisService.set(`email-verification:${email}`, hmac, 300);

    await await this.mailService.sendVerificationEmail({
      code,
      to: email,
    });
  }

  async finishEmailAuth(data: IFinishEmailAuthData): Promise<IJwtPair> {
    const storedHmac = await this.redisService.get(
      `email-verification:${data.email}`,
    );

    if (!storedHmac) throw new BadRequestException("The code has expired");

    const submittedHmac = createHmac(
      "sha256",
      this.configService.getOrThrow<string>("mail.verificationSecret"),
    )
      .update(data.code)
      .digest("hex");

    const isValid = timingSafeEqual(
      Buffer.from(storedHmac, "hex"),
      Buffer.from(submittedHmac, "hex"),
    );

    if (!isValid) throw new UnauthorizedException("The code is incorrect");

    const settingsId = await this.settingsService.createDefault();

    const userId = await this.userService.save({
      email: data.email,
      githubVerified: false,
      settingsId,
    });

    await this.redisService.del(`email-verification:${data.email}`);

    return this.jwtService.sign({
      id: userId,
      githubVerified: false,
      role: UserRoleEnum.USER,
    });
  }
}
