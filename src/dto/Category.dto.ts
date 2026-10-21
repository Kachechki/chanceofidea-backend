import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class CategoryDto {
  @ApiProperty({
    description: "Unique category identifier",
    format: "uuid",
    example: "550a22d6-ccbf-11f1-9fc9-12fb85b8a57f",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: "Category display name",
    example: "Web Development",
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "URL-friendly category identifier",
    example: "web-development",
  })
  @IsString()
  slug: string;
}
