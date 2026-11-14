import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1794592326431 implements MigrationInterface {
    name = 'Migration1794592326431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "avatarUrl" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ALTER COLUMN "avatarUrl" SET NOT NULL`);
    }

}
