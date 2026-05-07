import 'reflect-metadata';

import { DataSource } from 'typeorm';

import type { AppConfig } from './src/shared/config.ts';
import { erpEntities } from './src/infrastructure/persistence/typeorm/entities.ts';

interface PgQueryResult {
  rowCount: number | null;
}

interface PgClientLike {
  connect(): Promise<unknown>;
  query(queryText: string, values?: unknown[]): Promise<PgQueryResult>;
  end(): Promise<void>;
}

type PgClientConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

type PgClientConstructor = new (config: PgClientConfig) => PgClientLike;

async function getPgClientConstructor(): Promise<PgClientConstructor> {
  const pgModule = await import('pg');
  const moduleValue = pgModule as unknown as {
    Client?: PgClientConstructor;
    default?: { Client?: PgClientConstructor };
  };

  const client = moduleValue.Client ?? moduleValue.default?.Client;
  if (!client) {
    throw new Error('pg Client export was not found.');
  }

  return client;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function ensureDatabaseReady(config: AppConfig): Promise<void> {
  const Client = await getPgClientConstructor();

  const adminClient = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: 'postgres',
  });

  await adminClient.connect();
  try {
    const databaseCheck = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database.name],
    );

    if ((databaseCheck.rowCount ?? 0) === 0) {
      await adminClient.query(
        `CREATE DATABASE ${quoteIdentifier(config.database.name)}`,
      );
    }
  } finally {
    await adminClient.end();
  }

  const appClient = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.name,
  });

  await appClient.connect();
  try {
    await appClient.query(
      `CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(config.database.schema)}`,
    );
  } finally {
    await appClient.end();
  }
}

export function createAppDataSource(config: AppConfig): DataSource {
  return new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    schema: config.database.schema,
    synchronize: config.database.synchronize,
    logging: false,
    entities: erpEntities,
    migrations: [],
  });
}
