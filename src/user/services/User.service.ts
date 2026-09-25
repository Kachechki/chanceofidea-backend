import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { UserEntity } from "../entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ISaveUser } from "../../types/SaveUser.interface";

interface IUserService {
  save(data: ISaveUser): Promise<void>;
}

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(data: ISaveUser): Promise<void> {
    await this.repository.save({
      githubId: data.githubId,
      login: data.login,
      avatarUrl: data.avatarUrl,
      bio: data.bio ?? undefined,
      createdAt: new Date(),
    });
  }
}
