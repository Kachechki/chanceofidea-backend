import { registerAs } from "@nestjs/config";

export default registerAs("smtp", () => ({
  host: process.env.SMTP_HOST,
  from: process.env.SMTP_FROM,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASSWORD,
  port: process.env.SMTP_PORT,
}));
