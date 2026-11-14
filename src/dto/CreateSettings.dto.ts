import { IsEnum } from "class-validator";
import { PrefferedLocaleEnum } from "../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../enums/Theme.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSettingDto {
  @ApiProperty({
    description: "User's preferred locale",
    enum: PrefferedLocaleEnum,
    example: PrefferedLocaleEnum.EN,
  })
  @IsEnum(PrefferedLocaleEnum)
  prefferedLocale: PrefferedLocaleEnum;

  @ApiProperty({
    description: "User's preferred application theme",
    enum: ThemeEnum,
    example: ThemeEnum.DARK,
  })
  @IsEnum(ThemeEnum)
  theme: ThemeEnum;
}
