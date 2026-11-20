import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FindOptionsRelations, Repository } from "typeorm";
import { UserEntity } from "../entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ISaveUser } from "../../types/SaveUser.interface";
import { UserRoleEnum } from "../../enums/UserRole.enum";
import { ConfigService } from "@nestjs/config";
import { IJwtPair } from "../../types/JwtPair.interface";
import { JwtTokenService } from "../../auth/services/Jwt.service";

interface IUserService {
  save(data: ISaveUser): Promise<string>;
  findById(
    id: string,
    relations?: FindOptionsRelations<UserEntity>,
  ): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity>;
  passOnboarding(userId: string): Promise<void>;
  report(userId: string): Promise<void>;
  becomeAdmin(userId: string, code: string): Promise<IJwtPair>;
}

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => JwtTokenService))
    private readonly jwtService: JwtTokenService,
  ) {}

  async save(data: ISaveUser): Promise<string> {
    let existingUser = undefined;
    if (data.githubId) {
      existingUser = await this.repository.findOneBy({
        githubId: data.githubId,
      });
    } else if (data.email) {
      existingUser = await this.repository.findOneBy({
        email: data.email,
      });
    }

    return (
      await this.repository.save({
        id: existingUser?.id ?? undefined,
        githubId: data.githubId ?? undefined,
        login: data.login ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        bio: data.bio ?? undefined,
        createdAt: existingUser ? new Date() : undefined,
        updatedAt: new Date(),
        email: data.email ?? undefined,
        settingsId: data.settingsId ?? undefined,
        passedOnboarding: data.passedOnboarding ?? undefined,
      })
    ).id;
  }

  async findById(
    id: string,
    relations?: FindOptionsRelations<UserEntity>,
  ): Promise<UserEntity> {
    const user = await this.repository.findOne({ where: { id }, relations });
    if (!user) throw new NotFoundException("User not found");

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.repository.findOneBy({ email });
    if (!user) throw new NotFoundException("User not found");

    return user;
  }

  async passOnboarding(userId: string): Promise<void> {
    const user = await this.findById(userId);
    user.onboardingPassed = true;
    await this.repository.save(user);
  }

  async report(userId: string): Promise<void> {
    const user = await this.findById(userId);

    user.hasApprovedReport = true;

    await this.repository.save(user);
  }

  async becomeAdmin(userId: string, code: string): Promise<IJwtPair> {
    const user = await this.repository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException("User not found");

    if (
      (await this.configService.getOrThrow<string>(
        "moderation.becomeAdminCode",
      )) !== code
    )
      throw new BadRequestException("Your admin code is not correct");

    user.role = UserRoleEnum.ADMIN;

    await this.repository.save(user);

    return await this.jwtService.sign({
      id: user.id,
      githubVerified: user.githubVerified,
      role: user.role,
    });
  }
}
