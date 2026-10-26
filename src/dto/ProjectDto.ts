import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import { ProjectStatusEnum } from "../enums/ProjectStatus.enum";
import { UserDto } from "./User.dto";
import { CategoryDto } from "./Category.dto";
import { TagDto } from "./Tag.dto";

export class ProjectDto {
  @ApiProperty({
    description: "Unique project identifier",
    format: "uuid",
    example: "acf94e1a-82de-4086-be30-662e663edf18",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Project title",
    example: "Chance of Idea",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Current project status",
    enum: ProjectStatusEnum,
    enumName: "ProjectStatusEnum",
    example: ProjectStatusEnum.PUBLISHED,
  })
  @IsEnum(ProjectStatusEnum)
  status: ProjectStatusEnum;

  @ApiProperty({
    description: "Project description",
    example: "A marketplace for unfinished side projects.",
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: "Name of the project's GitHub repository",
    example: "chance-of-idea",
  })
  @IsString()
  repositoryName: string;

  @ApiProperty({
    description: "Date and time when the project was created",
    type: String,
    format: "date-time",
    example: "2026-10-21T12:00:00.000Z",
  })
  @IsDate()
  createdAt: Date;

  @ApiPropertyOptional({
    description: "User who owns the project",
    type: () => UserDto,
  })
  @IsOptional()
  owner?: UserDto;

  @ApiPropertyOptional({
    description: "Category assigned to the project",
    type: () => CategoryDto,
  })
  @IsOptional()
  category?: CategoryDto;

  @ApiPropertyOptional({
    description: "Tags associated with the project",
    type: () => TagDto,
    isArray: true,
  })
  @IsOptional()
  tags?: TagDto[];
}
