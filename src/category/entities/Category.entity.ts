import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CategoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, update: false })
  name: string;

  @Column({ unique: true, update: false })
  slug: string;
}
