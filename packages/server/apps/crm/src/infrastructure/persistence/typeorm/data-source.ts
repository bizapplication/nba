import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { env } from '../../../shared/config/env';
import { CustomerORM } from './entities/CustomerORM';
import { OrderORM } from './entities/OrderORM';
import { OpportunityORM } from './entities/OpportunityORM';

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function createClient(database: string) {
  return new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  });
}

export async function ensureDatabaseReady(): Promise<void> {
  const adminClient = createClient('postgres');

  await adminClient.connect();

  try {
    const databaseExists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.database]);

    if (!databaseExists.rowCount) {
      await adminClient.query(`CREATE DATABASE ${quoteIdentifier(env.db.database)}`);
    }
  } finally {
    await adminClient.end();
  }

  const appClient = createClient(env.db.database);
  await appClient.connect();

  try {
    await appClient.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(env.db.schema)}`);
  } finally {
    await appClient.end();
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  schema: env.db.schema,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  synchronize: env.db.synchronize,
  logging: env.db.logging,
  entities: [CustomerORM, OrderORM, OpportunityORM],
  migrations: ['src/infrastructure/persistence/typeorm/migrations/*.ts'],
});
