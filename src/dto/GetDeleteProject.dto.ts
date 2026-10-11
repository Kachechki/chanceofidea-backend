import { IsOptional, IsUUID } from "class-validator";

export class ProjectIdDto {
  @IsOptional()
  @IsUUID()
  id: string;
}
