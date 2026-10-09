import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791564871940 implements MigrationInterface {
    name = 'Migration1791564871940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, CONSTRAINT "UQ_ecbe8ebc20a3c7cd594d8e445e1" UNIQUE ("name"), CONSTRAINT "UQ_4bd5a4afa26650f75346238811b" UNIQUE ("slug"), CONSTRAINT "PK_1a38b9007ed8afab85026703a53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tag_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, CONSTRAINT "UQ_8f949d7a3a984759044054e89b8" UNIQUE ("name"), CONSTRAINT "UQ_34ca2b22cf68302f6112653a9f9" UNIQUE ("slug"), CONSTRAINT "PK_98efc66e2a1ce7fa1425e21e468" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."project_entity_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'TRANSFERRING', 'ADOPTED')`);
        await queryRunner.query(`CREATE TABLE "project_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "status" "public"."project_entity_status_enum" NOT NULL, "readiness" double precision NOT NULL, "description" character varying NOT NULL, "repositoryId" integer NOT NULL, "repostoryUrl" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "categoryId" uuid, CONSTRAINT "PK_7a75a94e01d0b50bff123db1b87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "projectsId" uuid`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f" FOREIGN KEY ("categoryId") REFERENCES "category_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_486fd16e123f963763c3df186cb" FOREIGN KEY ("projectsId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_486fd16e123f963763c3df186cb"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "projectsId"`);
        await queryRunner.query(`DROP TABLE "project_entity"`);
        await queryRunner.query(`DROP TYPE "public"."project_entity_status_enum"`);
        await queryRunner.query(`DROP TABLE "tag_entity"`);
        await queryRunner.query(`DROP TABLE "category_entity"`);
    }

}
