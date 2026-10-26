import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793047802490 implements MigrationInterface {
    name = 'Migration1793047802490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_cf666b6f62372fa3168515a1c00"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "REL_cf666b6f62372fa3168515a1c0"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_cf666b6f62372fa3168515a1c00" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_cf666b6f62372fa3168515a1c00"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "REL_cf666b6f62372fa3168515a1c0" UNIQUE ("projectId")`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_cf666b6f62372fa3168515a1c00" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
