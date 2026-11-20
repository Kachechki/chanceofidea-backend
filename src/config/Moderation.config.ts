import { registerAs } from "@nestjs/config";

export default registerAs("moderation", () => ({
  becomeAdminCode: process.env.MODERATION_BECOME_ADMIN_CODE,
}));
