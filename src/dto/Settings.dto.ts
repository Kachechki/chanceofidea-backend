import { IsEnum, IsUUID } from "class-validator";
import { PrefferedLocaleEnum } from "../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../enums/Theme.enum";
import { ApiProperty } from "@nestjs/swagger";

export class SettingsDto {
  @ApiProperty({
    description: "User settings ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @IsUUID()
  id: string;

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
