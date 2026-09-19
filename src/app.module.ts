import { Module } from "@nestjs/common";
import { createObserveModule } from "@nestjs/observe";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: "YOUR_APP_KEY",
      appSecret: "YOUR_APP_SECRET",
      serviceId: "backend",
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "db",
      port: Number(process.env.DB_PORT) ?? 3306,
      username: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "root",
      database: process.env.DB_NAME ?? "test",
      entities: [],
      synchronize: false,
      migrations: ["/migrations/**/*{.js,.ts}"],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
