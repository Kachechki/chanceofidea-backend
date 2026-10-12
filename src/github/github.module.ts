import { Module } from "@nestjs/common";
import { GithubController } from "./github.controller";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { GithubService } from "./services/Github.service";

@Module({
  imports: [UserModule, AuthModule],
  controllers: [GithubController],
  providers: [GithubService],
})
export class GithubModule {}
