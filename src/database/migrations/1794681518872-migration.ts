import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1794681518872 implements MigrationInterface {
    name = 'Migration1794681518872'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."settings_entity_prefferedlocale_enum" AS ENUM('EN', 'UK')`);
        await queryRunner.query(`CREATE TYPE "public"."settings_entity_theme_enum" AS ENUM('SYSTEM', 'DARK', 'LIGHT')`);
        await queryRunner.query(`CREATE TABLE "settings_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prefferedLocale" "public"."settings_entity_prefferedlocale_enum" NOT NULL, "theme" "public"."settings_entity_theme_enum" NOT NULL, CONSTRAINT "PK_67826a5286098fc8c650f8fa830" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "githubVerified" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "settingsId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_5fa332aab78d8f57365ac123c21" UNIQUE ("settingsId")`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_5fa332aab78d8f57365ac123c21" FOREIGN KEY ("settingsId") REFERENCES "settings_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_5fa332aab78d8f57365ac123c21"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "UQ_5fa332aab78d8f57365ac123c21"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "settingsId"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "githubVerified"`);
        await queryRunner.query(`DROP TABLE "settings_entity"`);
        await queryRunner.query(`DROP TYPE "public"."settings_entity_theme_enum"`);
        await queryRunner.query(`DROP TYPE "public"."settings_entity_prefferedlocale_enum"`);
    }

}
