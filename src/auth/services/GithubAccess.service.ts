import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserEntity } from "../../user/entities/User.entity";
import { GithubAccessEntity } from "../entities/GithubAccess.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UserService } from "../../user/services/User.service";
import { EncryptionService } from "./Encryption.service";

interface IGithubAccessService {
  save(accessToken: string, userId: string): Promise<void>;
  get(user: UserEntity): Promise<string>;
}

@Injectable()
export class GithubAccessService implements IGithubAccessService {
  constructor(
    @InjectRepository(GithubAccessEntity)
    private readonly repository: Repository<GithubAccessEntity>,
    private readonly userService: UserService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async save(accessToken: string, userId: string): Promise<void> {
    const user = await this.userService.findById(userId);

    const githubAccessToken = this.encryptionService.encrypt(accessToken);

    await this.repository.save({
      githubAccessToken,
      user,
    });
  }

  async get(user: UserEntity): Promise<string> {
    const accessToken = await this.repository.findOneBy({ user });
    if (!accessToken) throw new UnauthorizedException("No github access token");

    return this.encryptionService.decrypt(accessToken.githubAccessToken);
  }
}
