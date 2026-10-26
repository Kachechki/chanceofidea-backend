import { IsNumber } from "class-validator";

export class InstallDto {
  @IsNumber()
  installation_id: number;
}
