import { registerAs } from "@nestjs/config";

export default registerAs("github", () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  accessEncryptionKey: process.env.GITHUB_TOKEN_ENCRYPTION_KEY,
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY
}));
