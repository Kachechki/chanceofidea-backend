import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateApplicationDto {
  @ApiProperty({
    example: "5b0d1714-ccbb-11f1-8ef8-12fb85b8a57f",
    description: "Project ID that you are trying to apply for",
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    example: "Because I'm the best software engineer ever!",
    description: "Why should the project owner give this repository to YOU",
  })
  @IsString()
  whyMe: string;

  @ApiPropertyOptional({
    example:
      "I will finish this project, then put it in production, and it will be helping a lot of people",
    description: "What is your plan for this project?",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    example: "https://your-portfolio-url.com/you?idkanymore",
    description: "A url to your portfolio",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  porfolioUrl?: string;
}
