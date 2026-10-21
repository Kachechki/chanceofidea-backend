import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class UpdateProjectDto {
  @ApiProperty({
    description: "UUID of the project to update",
    format: "uuid",
    example: "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
  })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: "Updated project title",
    example: "Chance of Idea",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: "Project readiness between 0 and 1",
    example: 0.75,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Math.min(1, Math.max(0, value)))
  readiness?: number;

  @ApiPropertyOptional({
    description: "UUID of the project's category",
    format: "uuid",
    example: "660a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
  })
  @IsOptional()
  @IsUUID()
  category?: string;

  @ApiPropertyOptional({
    description: "UUIDs of the tags to associate with the project",
    type: String,
    format: "uuid",
    isArray: true,
    example: [
      "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
      "660a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Updated project description",
    example: "A marketplace for unfinished side projects.",
  })
  @IsOptional()
  @IsString()
  description?: string;
}
