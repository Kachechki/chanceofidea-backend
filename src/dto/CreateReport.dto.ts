import { IsString, IsUUID, MaxLength } from "class-validator";

export class CreateReportDto {
  @IsString()
  @MaxLength(30)
  title: string;

  @IsString()
  @MaxLength(130)
  body: string;

  @IsUUID(4)
  projectId: string;
}
