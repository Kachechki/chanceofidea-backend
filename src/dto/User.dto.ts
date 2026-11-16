import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from "class-validator";

import { ProjectDto } from "./ProjectDto";
import { ApplicationDto } from "./Application.dto";
import { SettingsDto } from "./Settings.dto";
import { NotificationDto } from "./Notification.dto";

export class UserDto {
  @ApiProperty({
    description: "Unique user identifier",
    format: "uuid",
    example: "f974b336-ccbf-11f1-a9dc-12fb85b8a57f",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "The user's GitHub login (username)",
    example: "octocat",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiProperty({
    description: "URL of the user's GitHub avatar",
    example: "https://avatars.githubusercontent.com/u/583231?v=4",
    format: "uri",
    nullable: true,
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: "The user's GitHub profile bio",
    example: "Developer, open-source enthusiast.",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: "Date and time when the user was created",
    type: String,
    format: "date-time",
    example: "2026-10-21T12:00:00.000Z",
  })
  @IsDate()
  createdAt: Date;

  @ApiPropertyOptional({
    description: "Projects owned by the user",
    type: () => ProjectDto,
    isArray: true,
  })
  @IsOptional()
  projects?: ProjectDto[];

  @ApiPropertyOptional({
    description: "Applications submitted by the user",
    type: () => ApplicationDto,
    isArray: true,
  })
  @IsOptional()
  applications?: ApplicationDto[];

  @ApiPropertyOptional({
    description: "User's email",
    example: "example@mail.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "User's personal settings",
    type: () => SettingsDto,
  })
  @IsOptional()
  settings?: SettingsDto;

  @ApiProperty({
    description: "Has the user passed the onboarding",
    example: false,
  })
  @IsBoolean()
  onboardingPassed: boolean;

  @ApiPropertyOptional({
    description: "User's unread notifications",
    type: () => NotificationDto,
  })
  @IsOptional()
  notifications?: NotificationDto[];
}
