import { Processor, WorkerHost } from "@nestjs/bullmq";
import { MailService } from "../services/Mail.service";
import { Job } from "bullmq";

@Processor("mail")
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case "verification":
        await this.mailService.sendEmail({
          to: job.data.to,
          subject: 'Your Chance of Idea verification code',
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family:Arial,Helvetica,sans-serif; color:#24292f;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
         style="background-color:#f4f5f7; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:560px; background-color:#ffffff; border-radius:12px;">

          <tr>
            <td style="padding:32px 36px 20px; text-align:center;">
              <h1 style="margin:0; font-size:24px;">Chance of Idea</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 36px 36px;">
              <h2 style="margin:0 0 16px; font-size:22px;">
                Verify your email address
              </h2>

              <p style="font-size:15px; line-height:1.6; color:#57606a;">
                Use the verification code below to confirm your email address
                and finish creating your account.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="margin:28px 0;">
                <tr>
                  <td align="center"
                      style="padding:22px; background-color:#f6f8fa; border-radius:8px;">
                    <span style="font-size:32px; font-weight:bold; letter-spacing:8px;
                                 color:#24292f;">
                      ${job.data.code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px; line-height:1.6; color:#6e7781;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 36px; background-color:#f6f8fa; text-align:center;">
              <p style="margin:0; font-size:12px; color:#6e7781;">
                © ${new Date().getFullYear()} Chance of Idea. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>

          `,
        });
        break;
    }
  }
}
