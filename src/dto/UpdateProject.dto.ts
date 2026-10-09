import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateProjectDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @Transform(({ value }) => Math.min(1, Math.max(0, value)))
  readiness: number;

  @IsOptional()
  @IsUUID()
  category: string;

  @IsOptional()
  @IsUUID(4, { each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  description: string;
}
