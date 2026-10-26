import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793058159033 implements MigrationInterface {
    name = 'Migration1793058159033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "UQ_f2d67e46db59790d67de9815643"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "UQ_f2d67e46db59790d67de9815643" UNIQUE ("repositoryName")`);
    }

}
