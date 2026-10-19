import { IsUUID } from "class-validator";

export class AcceptRejectApplicationDto {
  @IsUUID()
  applicationId: string;
}
