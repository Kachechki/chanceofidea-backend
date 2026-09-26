import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { UserService } from "./services/User.service";
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    me(req: IRequestWithRefresh): Promise<{
        id: string;
        bio: string;
        login: string;
        createdAt: Date;
        avatarUrl: string;
    }>;
}
