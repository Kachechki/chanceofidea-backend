import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

interface IRedisCacheService {
  set(field: string, value: string, expirationSeconds?: number): Promise<void>;
  get(field: string): Promise<string | null>;
  del(field: string): Promise<void>;
}

@Injectable()
export class RedisCacheService
  implements IRedisCacheService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      port: this.configService.getOrThrow<number>("redis.cache.port"),
      host: this.configService.getOrThrow<string>("redis.cache.host"),
      tls: this.configService.getOrThrow<boolean>("redis.cache.tls")
        ? {}
        : undefined,
      password: this.configService.getOrThrow<string>("redis.cache.password"),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.ping();
    this.logger.log("Connected to Redis");
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== "end") {
      await this.client.quit();
    }
  }

  async set(
    field: string,
    value: string,
    expirationSeconds?: number,
  ): Promise<void> {
    if (expirationSeconds !== undefined) {
      await this.client.set(field, value, "EX", expirationSeconds);
      return;
    }

    await this.client.set(field, value);
  }

  async get(field: string): Promise<string | null> {
    return this.client.get(field);
  }

  async del(field: string): Promise<void> {
    await this.client.del(field);
  }
}
