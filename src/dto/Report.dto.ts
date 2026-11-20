import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { ProjectDto } from "./ProjectDto";
import { UserDto } from "./User.dto";

export class ReportDto {
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(30)
  title: string;

  @IsString()
  @MaxLength(130)
  body: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  project?: ProjectDto;

  @IsOptional()
  writtenBy?: UserDto;
}
