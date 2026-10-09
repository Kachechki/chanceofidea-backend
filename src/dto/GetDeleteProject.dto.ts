import { IsOptional, IsString, IsUUID } from "class-validator";

export class GetDeleteProjectDto {
  @IsOptional()
  @IsUUID()
  id: string;
}
