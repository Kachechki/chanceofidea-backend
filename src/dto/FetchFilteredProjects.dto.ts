import { IsOptional, IsString } from "class-validator";

export class FetchFilteredProjects {
  @IsOptional()
  @IsString({ each: true })
  categorySlugs: string[] | string;

  @IsOptional()
  @IsString({ each: true })
  tagSlugs: string[] | string;
}
