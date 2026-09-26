import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { UserEntity } from "../entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ISaveUser } from "../../types/SaveUser.interface";

interface IUserService {
  save(data: ISaveUser): Promise<string>;
  findById(id: string): Promise<UserEntity>;
}

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(data: ISaveUser): Promise<string> {
    const existingUser = await this.repository.findOneBy({
      githubId: data.githubId,
    });
    return (
      await this.repository.save({
        id: existingUser?.id ?? undefined,
        githubId: data.githubId,
        login: data.login,
        avatarUrl: data.avatarUrl,
        bio: data.bio ?? undefined,
        createdAt: new Date(),
      })
    ).id;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repository.findOneBy({ id });
    if (!user) throw new NotFoundException("User not found");

    return user;
  }
}
