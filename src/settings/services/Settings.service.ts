import { Injectable, NotFoundException } from "@nestjs/common";
import { IUpdateSettings } from "../../types/UpdateSettings.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { SettingsEntity } from "../entities/Settings.entity";
import { Repository } from "typeorm";
import { PrefferedLocaleEnum } from "../../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../../enums/Theme.enum";

interface ISettingsService {
  createDefault(): Promise<string>;
  update(data: IUpdateSettings): Promise<void>;
}

@Injectable()
export class SettingsService implements ISettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly repository: Repository<SettingsEntity>,
  ) {}
  async update(data: IUpdateSettings): Promise<void> {
    const settings = await this.repository.findOneBy({
      user: { id: data.userId },
    });

    if (!settings) throw new NotFoundException("Settings not found");

    await this.repository.save({
      id: settings.id,
      prefferedLocale: data.prefferedLocale,
      theme: data.theme,
    });
  }

  async createDefault(): Promise<string> {
    return (
      await this.repository.save({
        prefferedLocale: PrefferedLocaleEnum.EN,
        theme: ThemeEnum.LIGHT,
      })
    ).id;
  }
}
