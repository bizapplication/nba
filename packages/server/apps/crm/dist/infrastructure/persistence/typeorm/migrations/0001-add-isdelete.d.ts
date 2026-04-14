import type { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddIsdelete0001 implements MigrationInterface {
    name: string;
    up(_queryRunner: QueryRunner): Promise<void>;
    down(_queryRunner: QueryRunner): Promise<void>;
}
