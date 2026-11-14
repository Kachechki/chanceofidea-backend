import { Module } from "@nestjs/common";
import { RedisService } from "./services/Redis.service";

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
