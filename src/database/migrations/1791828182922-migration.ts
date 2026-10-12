import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791828182922 implements MigrationInterface {
    name = 'Migration1791828182922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb"`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f" FOREIGN KEY ("categoryId") REFERENCES "category_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb" FOREIGN KEY ("githubAccessTokenGithubAccessToken") REFERENCES "github_access_entity"("githubAccessToken") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb"`);
        await queryRunner.query(`ALTER TABLE "project_entity" DROP CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb" FOREIGN KEY ("githubAccessTokenGithubAccessToken") REFERENCES "github_access_entity"("githubAccessToken") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_entity" ADD CONSTRAINT "FK_8acfd147219928f0c499c6dcd3f" FOREIGN KEY ("categoryId") REFERENCES "category_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
