import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { UserDto } from "./User.dto";
import { ApplicationStatusEnum } from "../enums/ApplicationStatus.enum";
import { ApiProperty } from "@nestjs/swagger";
import { ProjectDto } from "./ProjectDto";

export class ApplicationDto {
  @ApiProperty({
    example: "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    example: "I'm the best programmer on earth. That's why God chose me.",
  })
  @IsString()
  whyMe: string;

  @IsOptional()
  applicant?: UserDto;

  @IsOptional()
  project?: ProjectDto;

  @ApiProperty({
    example:
      "This, then that, and then this. Here, there, and I'm a millionarie.",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({
    example: "https://im-lazy-to.type",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiProperty({
    example: ApplicationStatusEnum.PENDING,
  })
  @IsEnum({ enum: ApplicationStatusEnum })
  status: ApplicationStatusEnum;

  @ApiProperty({
    example: "Because",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  rejectReason?: string;

  @ApiProperty({
    example: new Date(),
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
  })
  @IsDate()
  updatedAt: Date;
}
