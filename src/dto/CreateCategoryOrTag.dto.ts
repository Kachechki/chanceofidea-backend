import { IsString } from "class-validator";

export class CreateCategoryOrTagDto {
  @IsString()
  name: string;
}
