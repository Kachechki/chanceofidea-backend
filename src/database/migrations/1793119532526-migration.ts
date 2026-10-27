import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793119532526 implements MigrationInterface {
    name = 'Migration1793119532526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" DROP CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c"`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" ADD CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c" FOREIGN KEY ("projectEntityId") REFERENCES "project_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" DROP CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c"`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" ADD CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c" FOREIGN KEY ("projectEntityId") REFERENCES "project_entity"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
