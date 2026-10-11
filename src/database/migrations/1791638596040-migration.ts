import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791638596040 implements MigrationInterface {
    name = 'Migration1791638596040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project_entity_tags_tag_entity" ("projectEntityId" uuid NOT NULL, "tagEntityId" uuid NOT NULL, CONSTRAINT "PK_15c66146143a9a69fe6d3f136b2" PRIMARY KEY ("projectEntityId", "tagEntityId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b17af8c4dd97f84a5de82a03e2" ON "project_entity_tags_tag_entity"  ("projectEntityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1ac40ef9365d3eddc0540925d1" ON "project_entity_tags_tag_entity"  ("tagEntityId") `);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" ADD CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c" FOREIGN KEY ("projectEntityId") REFERENCES "project_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" ADD CONSTRAINT "FK_1ac40ef9365d3eddc0540925d11" FOREIGN KEY ("tagEntityId") REFERENCES "tag_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" DROP CONSTRAINT "FK_1ac40ef9365d3eddc0540925d11"`);
        await queryRunner.query(`ALTER TABLE "project_entity_tags_tag_entity" DROP CONSTRAINT "FK_b17af8c4dd97f84a5de82a03e2c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ac40ef9365d3eddc0540925d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b17af8c4dd97f84a5de82a03e2"`);
        await queryRunner.query(`DROP TABLE "project_entity_tags_tag_entity"`);
    }

}
