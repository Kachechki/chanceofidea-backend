import { IsEmail, IsNumber } from "class-validator";

export class FinishEmailAuthDto {
  @IsEmail()
  email: string;

  @IsNumber()
  code: number;
}
