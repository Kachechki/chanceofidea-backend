import { IsInt, IsOptional, IsString } from "class-validator";

export class SearchProjectsDto {
  @IsOptional()
  @IsString({ each: true })
  categorySlugs: string[] | string;

  @IsOptional()
  @IsString({ each: true })
  tagSlugs: string[] | string;

  @IsOptional()
  @IsString()
  searchQuery: string;
}

export class SearchProjectsPageDto {
  @IsInt()
  page: number;
}
