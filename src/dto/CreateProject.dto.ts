import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { ProjectStatusEnum } from "../enums/ProjectStatus.enum";
import { Transform } from "class-transformer";

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsEnum(ProjectStatusEnum)
  status: ProjectStatusEnum;

  @IsOptional()
  @Transform(({ value }) => Math.min(1, Math.max(0, value)))
  readiness: number;

  @IsString()
  description: string;

  @IsNumber()
  repositoryId: number;

  @IsString()
  repositoryUrl: string;

  @IsUUID()
  categoryId: string;

  @IsUUID(4, { each: true })
  tags: string[];

  @IsBoolean()
  publish: boolean;
}
