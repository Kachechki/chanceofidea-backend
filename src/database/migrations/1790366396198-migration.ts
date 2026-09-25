import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1790366396198 implements MigrationInterface {
    name = 'Migration1790366396198'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "githubId" integer NOT NULL, "login" character varying NOT NULL, "avatarUrl" character varying NOT NULL, "bio" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_bedf204fb1aa787e52263ca578e" UNIQUE ("githubId"), CONSTRAINT "UQ_e74b542753b5bf00d728607f81a" UNIQUE ("login"), CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_entity"`);
    }

}
