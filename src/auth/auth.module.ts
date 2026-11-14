import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/Auth.service";
import { UserModule } from "../user/user.module";
import { HashService } from "./services/Hash.service";
import { JwtTokenService } from "./services/Jwt.service";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GithubAccessEntity } from "./entities/GithubAccess.entity";
import { GithubAccessService } from "./services/GithubAccess.service";
import { EncryptionService } from "./services/Encryption.service";
import { MailModule } from "../mail/mail.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GithubAccessEntity]),
    forwardRef(() => UserModule),
    JwtModule,
    MailModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashService,
    JwtTokenService,
    GithubAccessService,
    EncryptionService,
  ],
  exports: [JwtTokenService, GithubAccessService],
})
export class AuthModule {}
