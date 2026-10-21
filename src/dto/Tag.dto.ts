import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { ProjectDto } from "./ProjectDto";

export class TagDto {
  @ApiProperty({
    description: "Unique tag identifier",
    format: "uuid",
    example: "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Tag display name",
    example: "TypeScript",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "URL-friendly tag identifier",
    example: "typescript",
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    description: "Projects associated with this tag",
    type: () => ProjectDto,
    isArray: true,
  })
  @IsOptional()
  projects: ProjectDto[];
}
