import { IsEnum, IsOptional } from "class-validator";
import { PrefferedLocaleEnum } from "../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../enums/Theme.enum";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UdpateSettingsDto {
  @ApiPropertyOptional({
    description: "User's preferred locale",
    enum: PrefferedLocaleEnum,
    example: PrefferedLocaleEnum.EN,
  })
  @IsEnum(PrefferedLocaleEnum)
  @IsOptional()
  prefferedLocale: PrefferedLocaleEnum;

  @ApiPropertyOptional({
    description: "User's preferred application theme",
    enum: ThemeEnum,
    example: ThemeEnum.DARK,
  })
  @IsEnum(ThemeEnum)
  @IsOptional()
  theme: ThemeEnum;
}