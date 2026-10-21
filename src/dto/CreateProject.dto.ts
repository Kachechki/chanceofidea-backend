import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreateProjectDto {
  @ApiProperty({
    description: "Title of the project",
    example: "Chance of Idea",
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: "Project readiness, between 0 and 1",
    example: 0.6,
    minimum: 0,
    maximum: 1,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Math.min(1, Math.max(0, value)))
  readiness: number;

  @ApiProperty({
    description: "Description of the project",
    example: "A marketplace for unfinished side projects.",
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "Name of the GitHub repository",
    example: "chance-of-idea",
  })
  @IsString()
  repositoryName: string;

  @ApiProperty({
    description: "UUID of the project's category",
    format: "uuid",
    example: "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: "UUIDs of the tags to associate with the project",
    type: String,
    format: "uuid",
    isArray: true,
    example: [
      "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
      "660a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
    ],
  })
  @IsUUID("4", { each: true })
  tags: string[];

  @ApiProperty({
    description: "Whether the project should be published immediately",
    example: true,
  })
  @IsBoolean()
  publish: boolean;
}
