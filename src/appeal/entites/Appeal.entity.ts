import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AppealEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

}