import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { UserDto } from "./User.dto";

export class NotificationDto {
  @ApiProperty({
    description: "Unique identifier of the notification",
    example: "b55d42ca-eaea-43ed-87c7-3e53317540fe",
    format: "uuid",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Notification topic",
    example: "Project application",
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: "Notification body",
    example: "Someone has applied to your project.",
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: "User associated with the notification",
    type: () => UserDto,
  })
  @IsOptional()
  user?: UserDto;
}
