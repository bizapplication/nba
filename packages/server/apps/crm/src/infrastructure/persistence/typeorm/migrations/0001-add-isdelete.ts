import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsdelete0001 implements MigrationInterface {
  name = 'AddIsdelete0001';

  async up(_queryRunner: QueryRunner): Promise<void> {
    // Schema is managed by TypeORM synchronize for this bootstrap version.
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op in bootstrap migration.
  }
}
