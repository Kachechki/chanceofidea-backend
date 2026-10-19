import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateApplicationDto {
    @IsUUID()
    projectId: string;

    @IsString()
    whyMe: string;

    @IsOptional()
    @IsString()
    plan?: string;

    @IsOptional()
    @IsString()
    porfolioUrl: string;
}