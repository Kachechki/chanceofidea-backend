import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { IEmailData } from "../../types/EmilData.interface";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";
import { ISendVerificationEmailData } from "../../types/SendVerificationEmailData.interface";

interface IMailService {
  sendVerificationEmail(data: ISendVerificationEmailData): Promise<void>;
  sendEmail(data: IEmailData): Promise<void>;
}

@Injectable()
export class MailService implements IMailService, OnModuleInit {
  private readonly transporter: Transporter;

  constructor(
    @InjectQueue("mail")
    private readonly mailQueue: Queue,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>("smtp.host"),
      port: this.config.getOrThrow<number>("smtp.port"),
      secure: false,
      auth: {
        user: this.config.getOrThrow<string>("smtp.user"),
        pass: this.config.getOrThrow<string>("smtp.pass"),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.transporter.verify();
  }

  async sendVerificationEmail(data: ISendVerificationEmailData) {
    await this.mailQueue.add("verification", data);
  }

  async sendEmail(data: IEmailData): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>("smtp.from"),
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
  }
}
