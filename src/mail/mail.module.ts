import { Module } from "@nestjs/common";
import { MailService } from "./services/Mail.service";
import { BullModule } from "@nestjs/bullmq";
import { MailProcessor } from "./processors/Mail.processor";

@Module({
  imports: [BullModule.registerQueue({ name: "mail" })],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
