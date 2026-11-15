import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1794733712944 implements MigrationInterface {
    name = 'Migration1794733712944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "onboardingPassed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "onboardingPassed"`);
    }

}
