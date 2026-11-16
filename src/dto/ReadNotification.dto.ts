import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ReadNotificationDto {
  @ApiProperty({
    description: "Unique identifier of the notification to mark as read",
    example: "5b0d1714-ccbb-11f1-8ef8-12fb85b8a57f",
    format: "uuid",
  })
  @IsUUID()
  id: string;
}
