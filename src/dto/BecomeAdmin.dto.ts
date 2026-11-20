import { IsString } from "class-validator";

export class BecomeAdminDto {
  @IsString()
  code: string;
}
