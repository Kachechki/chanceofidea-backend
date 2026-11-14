import { MailService } from "./Mail.service";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import nodemailer from "nodemailer";

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe("MailService", () => {
  let service: MailService;

  let mailQueue: {
    add: jest.Mock;
  };

  let configService: {
    getOrThrow: jest.Mock;
  };

  let transporter: {
    verify: jest.Mock;
    sendMail: jest.Mock;
  };

  beforeEach(() => {
    mailQueue = {
      add: jest.fn(),
    };

    transporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({}),
    };

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const config = {
          "smtp.host": "smtp.example.com",
          "smtp.port": 587,
          "smtp.user": "test@example.com",
          "smtp.pass": "test-password",
          "smtp.from": "noreply@example.com",
        };

        return config[key as keyof typeof config];
      }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(transporter);

    service = new MailService(
      mailQueue as unknown as Queue,
      configService as unknown as ConfigService,
    );
  });

  describe("constructor", () => {
    it("should create the SMTP transporter with the correct configuration", () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@example.com",
          pass: "test-password",
        },
      });
    });
  });

  describe("onModuleInit", () => {
    it("should verify the SMTP connection", async () => {
      await service.onModuleInit();

      expect(transporter.verify).toHaveBeenCalledTimes(1);
    });

    it("should propagate transporter verification errors", async () => {
      const error = new Error("SMTP connection failed");

      transporter.verify.mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
    });
  });

  describe("sendVerificationEmail", () => {
    it("should add a verification job to the mail queue", async () => {
      const data = {
        to: "test@example.com",
        code: "123456",
      };

      await service.sendVerificationEmail(data);

      expect(mailQueue.add).toHaveBeenCalledWith("verification", data);
    });

    it("should propagate queue errors", async () => {
      const error = new Error("Redis connection failed");

      mailQueue.add.mockRejectedValue(error);

      await expect(
        service.sendVerificationEmail({
          to: "test@example.com",
          code: "123456",
        }),
      ).rejects.toThrow(error);
    });
  });

  describe("sendEmail", () => {
    it("should send an email using the SMTP transporter", async () => {
      const data = {
        to: "test@example.com",
        subject: "Test subject",
        html: "<h1>Hello</h1>",
      };

      await service.sendEmail(data);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: "noreply@example.com",
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
    });

    it("should propagate SMTP errors", async () => {
      const error = new Error("SMTP delivery failed");

      transporter.sendMail.mockRejectedValue(error);

      await expect(
        service.sendEmail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        }),
      ).rejects.toThrow(error);
    });
  });
});
