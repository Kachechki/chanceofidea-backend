import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class SearchProjectsDto {
  @ApiPropertyOptional({
    description:
      "Category slugs to filter projects by. Accepts one slug or multiple slugs.",
    example: ["web-development", "machine-learning"],
    oneOf: [
      { type: "string", example: "web-development" },
      { type: "array", items: { type: "string" } },
    ],
  })
  @IsOptional()
  @IsString({ each: true })
  categorySlugs: string[] | string;

  @ApiPropertyOptional({
    description:
      "Tag slugs to filter projects by. Accepts one slug or multiple slugs.",
    example: ["nestjs", "typescript"],
    oneOf: [
      { type: "string", example: "nestjs" },
      { type: "array", items: { type: "string" } },
    ],
  })
  @IsOptional()
  @IsString({ each: true })
  tagSlugs: string[] | string;

  @ApiPropertyOptional({
    description: "Search query for matching projects",
    example: "telegram bot",
  })
  @IsOptional()
  @IsString()
  searchQuery: string;

  @ApiProperty({
    description: "Page number for pagination, starting at 1",
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;
}
