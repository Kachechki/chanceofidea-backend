import { IsUUID } from "class-validator";

export class FinishTransferDto {
  @IsUUID()
  applicationId: string;
}
