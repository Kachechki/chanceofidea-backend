import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1795195939704 implements MigrationInterface {
    name = 'Migration1795195939704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "report_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "body" character varying NOT NULL, "approved" boolean, "projectId" uuid, "writtenById" uuid, CONSTRAINT "PK_7862cb0d03ad2677692143cf38e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_entity_type_enum" AS ENUM('NEW_APPLICATION', 'APPLICATION_REJECTED', 'APPLICATION_ACCEPTED', 'APPLCIATION_UPDATED', 'TRANSFER_FAILED', 'TRANSFER_CANCELED', 'TRANSFER_COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "notification_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "topic" character varying NOT NULL, "body" character varying NOT NULL, "type" "public"."notification_entity_type_enum" NOT NULL, "userId" uuid, CONSTRAINT "PK_112676de71a3a708b914daed289" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "hasApprovedReport" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."user_entity_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "role" "public"."user_entity_role_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."project_entity_status_enum" ADD VALUE 'SUSPENDED'`);
        await queryRunner.query(`ALTER TABLE "report_entity" ADD CONSTRAINT "FK_78c383a9b14490fd91f93272986" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_entity" ADD CONSTRAINT "FK_08d919b7c2a8151cce2ac9013b8" FOREIGN KEY ("writtenById") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ADD CONSTRAINT "FK_dd9edd17abec9f32798a1f1e22d" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_entity" DROP CONSTRAINT "FK_dd9edd17abec9f32798a1f1e22d"`);
        await queryRunner.query(`ALTER TABLE "report_entity" DROP CONSTRAINT "FK_08d919b7c2a8151cce2ac9013b8"`);
        await queryRunner.query(`ALTER TABLE "report_entity" DROP CONSTRAINT "FK_78c383a9b14490fd91f93272986"`);
        await queryRunner.query(`CREATE TYPE "public"."project_entity_status_enum_old" AS ENUM('DRAFT', 'PUBLISHED', 'TRANSFERRING', 'ADOPTED')`);
        await queryRunner.query(`ALTER TABLE "project_entity" ALTER COLUMN "status" TYPE "public"."project_entity_status_enum_old" USING "status"::"text"::"public"."project_entity_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."project_entity_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."project_entity_status_enum_old" RENAME TO "project_entity_status_enum"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."user_entity_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "hasApprovedReport"`);
        await queryRunner.query(`DROP TABLE "notification_entity"`);
        await queryRunner.query(`DROP TYPE "public"."notification_entity_type_enum"`);
        await queryRunner.query(`DROP TABLE "report_entity"`);
    }

}
