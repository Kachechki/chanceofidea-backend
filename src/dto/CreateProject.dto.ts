import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsOptional()
  @Transform(({ value }) => Math.min(1, Math.max(0, value)))
  readiness: number;

  @IsString()
  description: string;

  @IsString()
  repositoryName: string

  @IsUUID()
  categoryId: string;

  @IsUUID(4, { each: true })
  tags: string[];

  @IsBoolean()
  publish: boolean;
}
