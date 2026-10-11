import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791639997268 implements MigrationInterface {
    name = 'Migration1791639997268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_486fd16e123f963763c3df186cb"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "projectsId"`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "FK_777c9041f749f6788765f6bb106" FOREIGN KEY ("ownerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "FK_777c9041f749f6788765f6bb106"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP COLUMN "ownerId"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "projectsId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_486fd16e123f963763c3df186cb" FOREIGN KEY ("projectsId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
