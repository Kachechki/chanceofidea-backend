import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791638795396 implements MigrationInterface {
    name = 'Migration1791638795396'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" RENAME COLUMN "repostoryUrl" TO "repositoryUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" RENAME COLUMN "repositoryUrl" TO "repostoryUrl"`);
    }

}
