import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString, IsUrl } from "class-validator";

export class GithubRepositoryDto {
  @ApiProperty({
    description: "Name of the GitHub repository",
    example: "chance-of-idea",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "URL of the GitHub repository",
    example: "https://github.com/username/chance-of-idea",
    format: "uri",
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: "Description of the repository",
    example: "A marketplace for unfinished side projects.",
    nullable: true,
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "Whether the repository is private",
    example: false,
  })
  @IsBoolean()
  private: boolean;
}
