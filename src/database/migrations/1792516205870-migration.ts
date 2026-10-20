import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792516205870 implements MigrationInterface {
    name = 'Migration1792516205870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."transfer_session_entity_status_enum" ADD VALUE 'CANCELED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transfer_session_entity_status_enum_old" AS ENUM('ACTIVE', 'FINISHED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ALTER COLUMN "status" TYPE "public"."transfer_session_entity_status_enum_old" USING "status"::"text"::"public"."transfer_session_entity_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transfer_session_entity_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transfer_session_entity_status_enum_old" RENAME TO "transfer_session_entity_status_enum"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP COLUMN "createdAt"`);
    }

}
