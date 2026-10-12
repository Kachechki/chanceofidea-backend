import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791826080806 implements MigrationInterface {
    name = 'Migration1791826080806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "github_access_entity" ("githubAccessToken" character varying NOT NULL, CONSTRAINT "PK_4b921e2a01a80092a2d105e29de" PRIMARY KEY ("githubAccessToken"))`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "githubAccessTokenGithubAccessToken" character varying`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_90354c1de92af8d2f8ead88eacb" UNIQUE ("githubAccessTokenGithubAccessToken")`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb" FOREIGN KEY ("githubAccessTokenGithubAccessToken") REFERENCES "github_access_entity"("githubAccessToken") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "UQ_90354c1de92af8d2f8ead88eacb"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "githubAccessTokenGithubAccessToken"`);
        await queryRunner.query(`DROP TABLE "github_access_entity"`);
    }

}
