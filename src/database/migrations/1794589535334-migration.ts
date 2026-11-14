import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1794589535334 implements MigrationInterface {
    name = 'Migration1794589535334'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "email" character varying`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_415c35b9b3b6fe45a3b065030f5" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "githubId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "login" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "login" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "githubId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "UQ_415c35b9b3b6fe45a3b065030f5"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "email"`);
    }

}
