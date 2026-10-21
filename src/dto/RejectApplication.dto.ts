import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RejectApplicationDto {
  @ApiProperty({
    example: "A bad programmer. Not like I am",
    description: "Why is the application being rejected",
    nullable: true,
  })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}
