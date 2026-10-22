import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792658996473 implements MigrationInterface {
    name = 'Migration1792658996473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_entity" DROP CONSTRAINT "FK_70b72075a4459c571373da13090"`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP CONSTRAINT "FK_9bd227f528489599d29a402b5a8"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_cf666b6f62372fa3168515a1c00"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" DROP CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD CONSTRAINT "FK_70b72075a4459c571373da13090" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD CONSTRAINT "FK_9bd227f528489599d29a402b5a8" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f" FOREIGN KEY ("categoryId") REFERENCES "category_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_cf666b6f62372fa3168515a1c00" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" ADD CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c" FOREIGN KEY ("projectEntityId") REFERENCES "project_entity"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" DROP CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_cf666b6f62372fa3168515a1c00"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f"`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP CONSTRAINT "FK_9bd227f528489599d29a402b5a8"`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP CONSTRAINT "FK_70b72075a4459c571373da13090"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" ADD CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c" FOREIGN KEY ("projectEntityId") REFERENCES "project_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_cf666b6f62372fa3168515a1c00" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f" FOREIGN KEY ("categoryId") REFERENCES "category_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD CONSTRAINT "FK_9bd227f528489599d29a402b5a8" FOREIGN KEY ("projectId") REFERENCES "project_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_entity" ADD CONSTRAINT "FK_70b72075a4459c571373da13090" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
