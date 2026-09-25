import { Repository } from "typeorm";
import { UserEntity } from "../entities/User.entity";
import { ISaveUser } from "../../types/SaveUser.interface";
interface IUserService {
    save(data: ISaveUser): Promise<void>;
}
export declare class UserService implements IUserService {
    private readonly repository;
    constructor(repository: Repository<UserEntity>);
    save(data: ISaveUser): Promise<void>;
}
export {};
