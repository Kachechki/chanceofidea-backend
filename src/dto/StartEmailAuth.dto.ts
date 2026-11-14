import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class StartEmailAuthDto {
  @IsEmail()
  email: string;
}
