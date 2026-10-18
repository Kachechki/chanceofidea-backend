import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792346636967 implements MigrationInterface {
    name = 'Migration1792346636967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."application_entity_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "application_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "whyMe" character varying NOT NULL, "plan" character varying, "portflioUrl" character varying, "status" "public"."application_entity_status_enum" NOT NULL, "rejectReason" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "applicantId" uuid, "projectId" uuid, CONSTRAINT "PK_c999b2d40dd9ad46b17b47fb842" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transfer_session_entity_status_enum" AS ENUM('ACTIVE', 'FINISHED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "transfer_session_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."transfer_session_entity_status_enum" NOT NULL DEFAULT 'ACTIVE', "projectId" uuid, "applicantId" uuid, CONSTRAINT "REL_cf666b6f62372fa3168515a1c0" UNIQUE ("projectId"), CONSTRAINT "REL_4ba59c1e8cb1bb9d4bc769a9c0" UNIQUE ("applicantId"), CONSTRAINT "PK_73c66559b03bba552e4a8e72699" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "UQ_f2d67e46db59790d67de9815643" UNIQUE ("repositoryName")`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD CONSTRAINT "FK_70b72075a4459c571373da13090" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD CONSTRAINT "FK_9bd227f528489599d29a402b5a8" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_cf666b6f62372fa3168515a1c00" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_cf666b6f62372fa3168515a1c00"`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP CONSTRAINT "FK_9bd227f528489599d29a402b5a8"`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP CONSTRAINT "FK_70b72075a4459c571373da13090"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "UQ_f2d67e46db59790d67de9815643"`);
        await queryRunner.query(`DROP TABLE "transfer_session_entity"`);
        await queryRunner.query(`DROP TYPE "public"."transfer_session_entity_status_enum"`);
        await queryRunner.query(`DROP TABLE "application_entity"`);
        await queryRunner.query(`DROP TYPE "public"."application_entity_status_enum"`);
    }

}
