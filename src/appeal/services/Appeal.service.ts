import { Injectable } from "@nestjs/common";

interface IAppealService {
    // create(): Promise<void>;
}

@Injectable()
export class AppealService implements IAppealService {}