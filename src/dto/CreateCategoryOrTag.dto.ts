import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCategoryOrTagDto {
  @ApiProperty({
    description: "category or tag name",
    example: "category 1",
  })
  @IsString()
  name: string;
}
