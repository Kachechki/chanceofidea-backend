import { registerAs } from "@nestjs/config";

export default registerAs("redis", () => ({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  tls: process.env.REDIS_TLS === "true",
  password: process.env.REDIS_PASSWORD,
  cache: {
    host: process.env.REDIS_CACHE_HOST,
    port: process.env.REDIS_CACHE_PORT,
    tls: process.env.REDIS_CACHE_TLS === "true",
    password: process.env.REDIS_CACHE_PASSWORD,
  },
}));
