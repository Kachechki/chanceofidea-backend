import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PrefferedLocaleEnum } from "../../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../../enums/Theme.enum";
import { UserEntity } from "../../user/entities/User.entity";

@Entity()
export class SettingsEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: PrefferedLocaleEnum })
  prefferedLocale: PrefferedLocaleEnum;

  @Column({ type: "enum", enum: ThemeEnum })
  theme: ThemeEnum;

  @OneToOne(() => UserEntity, (user) => user.settings, {
    onDelete: "CASCADE",
    cascade: true,
  })
  user: UserEntity;
}
