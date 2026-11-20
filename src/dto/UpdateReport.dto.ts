import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateReportDto {
    @IsUUID(4)
    id: string;

    @IsString()
    @MaxLength(30)
    @IsOptional()
    title: string;

    @IsString()
    @MaxLength(130)
    @IsOptional()
    body: string;
}