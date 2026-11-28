import { Module } from "@nestjs/common";
import { RedisCacheService } from "./services/RedisCache.service";

@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
