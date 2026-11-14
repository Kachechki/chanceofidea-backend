import { PrefferedLocaleEnum } from "../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../enums/Theme.enum";

export interface IUpdateSettings {
  userId: string;
  prefferedLocale: PrefferedLocaleEnum;
  theme: ThemeEnum;
}
