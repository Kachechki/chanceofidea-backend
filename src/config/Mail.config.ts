import { registerAs } from "@nestjs/config";

export default registerAs("mail", () => ({
  verificationSecret: process.env.MAIL_VERIFICATION_SECRET,
}));
