import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793050158089 implements MigrationInterface {
    name = 'Migration1793050158089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb"`);
        await queryRunner.query(`ALTER TABLE "user_entity" RENAME COLUMN "githubAccessTokenGithubAccessToken" TO "githubAccessTokenId"`);
        await queryRunner.query(`ALTER TABLE "user_entity" RENAME CONSTRAINT "UQ_90354c1de92af8d2f8ead88eacb" TO "UQ_46a02401a293fc5789d83c77627"`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" DROP CONSTRAINT "PK_4b921e2a01a80092a2d105e29de"`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" ADD CONSTRAINT "PK_14d4eb45beb9613d8f51532c7ea" PRIMARY KEY ("githubAccessToken", "id")`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" DROP CONSTRAINT "PK_14d4eb45beb9613d8f51532c7ea"`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" ADD CONSTRAINT "PK_1f38335968ad5918086f9ff6ece" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" ADD CONSTRAINT "UQ_4b921e2a01a80092a2d105e29de" UNIQUE ("githubAccessToken")`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "UQ_46a02401a293fc5789d83c77627"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "githubAccessTokenId"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "githubAccessTokenId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_46a02401a293fc5789d83c77627" UNIQUE ("githubAccessTokenId")`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "REL_4ba59c1e8cb1bb9d4bc769a9c0"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_46a02401a293fc5789d83c77627" FOREIGN KEY ("githubAccessTokenId") REFERENCES "github_access_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" DROP CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "FK_46a02401a293fc5789d83c77627"`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "REL_4ba59c1e8cb1bb9d4bc769a9c0" UNIQUE ("applicantId")`);
        await queryRunner.query(`ALTER TABLE "transfer_session_entity" ADD CONSTRAINT "FK_4ba59c1e8cb1bb9d4bc769a9c08" FOREIGN KEY ("applicantId") REFERENCES "user_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP CONSTRAINT "UQ_46a02401a293fc5789d83c77627"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "githubAccessTokenId"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "githubAccessTokenId" character varying`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "UQ_46a02401a293fc5789d83c77627" UNIQUE ("githubAccessTokenId")`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" DROP CONSTRAINT "UQ_4b921e2a01a80092a2d105e29de"`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" DROP CONSTRAINT "PK_1f38335968ad5918086f9ff6ece"`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" ADD CONSTRAINT "PK_14d4eb45beb9613d8f51532c7ea" PRIMARY KEY ("githubAccessToken", "id")`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" DROP CONSTRAINT "PK_14d4eb45beb9613d8f51532c7ea"`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" ADD CONSTRAINT "PK_4b921e2a01a80092a2d105e29de" PRIMARY KEY ("githubAccessToken")`);
        await queryRunner.query(`ALTER TABLE "github_access_entity" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "user_entity" RENAME CONSTRAINT "UQ_46a02401a293fc5789d83c77627" TO "UQ_90354c1de92af8d2f8ead88eacb"`);
        await queryRunner.query(`ALTER TABLE "user_entity" RENAME COLUMN "githubAccessTokenId" TO "githubAccessTokenGithubAccessToken"`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD CONSTRAINT "FK_90354c1de92af8d2f8ead88eacb" FOREIGN KEY ("githubAccessTokenGithubAccessToken") REFERENCES "github_access_entity"("githubAccessToken") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
