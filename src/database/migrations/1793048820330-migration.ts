import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793048820330 implements MigrationInterface {
    name = 'Migration1793048820330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "REL_4ba59c1e8cb1bb9d4bc769a9c0"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "REL_4ba59c1e8cb1bb9d4bc769a9c0" UNIQUE ("applicantId")`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
