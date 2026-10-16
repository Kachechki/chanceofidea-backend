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
import { GithubModule } from './github/github.module';
import { CategoriesSeederModule } from './categories-seeder/categories-seeder.module';
import { TagsSeederModule } from './tags-seeder/tags-seeder.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // ObserveModule.forRoot({
    //   appKey: "YOUR_APP_KEY",
    //   appSecret: "YOUR_APP_SECRET",
    //   serviceId: "backend",
    // }), // Maybe we'll put it later for something like graphana
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
      ],
      synchronize: false,
      migrations: [__dirname + "/migrations/*{.js,.ts}"],
    }),
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [GithubConfig, JwtConfig],
    }),
    ProjectModule,
    CategoryModule,
    TagModule,
    GithubModule,
    CategoriesSeederModule,
    TagsSeederModule,
  ],
})
export class AppModule {}
