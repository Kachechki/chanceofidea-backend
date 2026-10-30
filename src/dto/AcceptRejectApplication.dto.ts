import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AcceptRejectApplicationDto {
  @ApiProperty({
    example: "b5cae400-ccbc-11f1-b381-12fb85b8a57f",
    description: "Which application to be accepted or rejected",
  })
  @IsUUID()
  id: string;
}
