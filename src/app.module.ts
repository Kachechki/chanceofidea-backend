import { Module } from "@nestjs/common";
import { createObserveModule } from "@nestjs/observe";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { UserEntity } from "./user/entities/User.entity";
import { ProjectModule } from "./project/project.module";
import { CategoryModule } from "./category/category.module";
import { TagModule } from "./tag/tag.module";
import GithubConfig from "./config/Github.config";
import JwtConfig from "./config/Jwt.config";
import { ProjectEntity } from "./project/entities/Project.entity";
import { CategoryEntity } from "./category/entities/Category.entity";
import { TagEntity } from "./tag/entities/Tag.entity";
import { GithubAccessEntity } from "./auth/entities/GithubAccess.entity";
import { GithubModule } from "./github/github.module";
import { CategoriesSeederModule } from "./categories-seeder/categories-seeder.module";
import { TagsSeederModule } from "./tags-seeder/tags-seeder.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { ApplicationModule } from "./application/application.module";
import { ApplicationEntity } from "./application/entities/Application.entity";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TransferSessionModule } from "./transfer-session/transfer-session.module";
import { TransferSessionEntity } from "./transfer-session/entities/TransferSession.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { MailModule } from "./mail/mail.module";
import "dotenv/config";
import { BullModule } from "@nestjs/bullmq";
import { RedisModule } from "./redis/redis.module";
import SMTPConfig from "./config/SMTP.config";
import RedisConfig from "./config/Redis.config";
import MailConfig from "./config/Mail.config";

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "db",
      port: Number(process.env.DB_PORT) ?? 3306,
      username: process.env.DB_USER ?? "admin",
      password: process.env.DB_PASSWORD ?? "admin",
      database: process.env.DB_NAME ?? "database",
      entities: [
        UserEntity,
        ProjectEntity,
        CategoryEntity,
        TagEntity,
        GithubAccessEntity,
        ApplicationEntity,
        TransferSessionEntity,
      ],
      synchronize: false,
      migrations: [__dirname + "/migrations/*{.js,.ts}"],
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    }),
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [GithubConfig, JwtConfig, SMTPConfig, RedisConfig, MailConfig],
    }),
    ProjectModule,
    CategoryModule,
    TagModule,
    GithubModule,
    CategoriesSeederModule,
    TagsSeederModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    ApplicationModule,
    EventEmitterModule.forRoot(),
    TransferSessionModule,
    CacheModule.register({ isGlobal: true }),
    MailModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "redis",
        port: Number(process.env.REDIS_PORT) ?? 6379,
      },
    }),
    RedisModule,
  ],
})
export class AppModule {}
