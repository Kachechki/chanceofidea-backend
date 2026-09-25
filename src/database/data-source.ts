import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { UserEntity } from "../user/entities/User.entity";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "db",
  port: Number(process.env.DB_PORT) ?? 5432,
  username: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "root",
  database: process.env.DB_NAME ?? "test",
  entities: [UserEntity],
  synchronize: false,
  migrations: [__dirname + "/migrations/*{.js,.ts}"],
});
