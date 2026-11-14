import { MailProcessor } from "./Mail.processor";
import { MailService } from "../services/Mail.service";
import { Job } from "bullmq";

describe("MailProcessor", () => {
  let processor: MailProcessor;

  let mailService: {
    sendEmail: jest.Mock;
  };

  beforeEach(() => {
    mailService = {
      sendEmail: jest.fn(),
    };

    processor = new MailProcessor(mailService as unknown as MailService);
  });

  describe("process", () => {
    it("should send a verification email", async () => {
      const job = {
        name: "verification",
        data: {
          to: "test@example.com",
          code: "123456",
        },
      } as Job;

      await processor.process(job);

      expect(mailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Your Chance of Idea verification code",
        }),
      );

      const email = mailService.sendEmail.mock.calls[0][0];

      expect(email.html).toContain("123456");
      expect(email.html).toContain("Chance of Idea");
    });

    it("should not send an email for an unknown job", async () => {
      const job = {
        name: "unknown",
        data: {},
      } as Job;

      await processor.process(job);

      expect(mailService.sendEmail).not.toHaveBeenCalled();
    });

    it("should propagate errors from MailService", async () => {
      const error = new Error("SMTP connection failed");

      mailService.sendEmail.mockRejectedValue(error);

      const job = {
        name: "verification",
        data: {
          to: "test@example.com",
          code: "123456",
        },
      } as Job;

      await expect(processor.process(job)).rejects.toThrow(error);
    });
  });
});
