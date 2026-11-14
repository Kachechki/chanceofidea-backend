import { Injectable, NotFoundException } from "@nestjs/common";
import { FindOptionsRelations, Repository } from "typeorm";
import { UserEntity } from "../entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ISaveUser } from "../../types/SaveUser.interface";
import { QueueAction } from "rxjs/internal/scheduler/QueueAction";

interface IUserService {
  save(data: ISaveUser): Promise<string>;
  findById(
    id: string,
    relations?: FindOptionsRelations<UserEntity>,
  ): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity>;
}

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
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
        settingsId: data.settingsId ?? undefined
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
}
