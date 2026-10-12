import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791826732169 implements MigrationInterface {
    name = 'Migration1791826732169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" DROP COLUMN "repositoryId"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP COLUMN "repositoryUrl"`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD "repositoryName" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" DROP COLUMN "repositoryName"`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD "repositoryUrl" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD "repositoryId" integer NOT NULL`);
    }

}
