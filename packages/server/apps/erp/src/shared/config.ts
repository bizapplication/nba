export const dataModes = ['memory', 'db'] as const;
export type DataMode = (typeof dataModes)[number];

export interface AppConfig {
  host: string;
  port: number;
  dataMode: DataMode;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    schema: string;
    synchronize: boolean;
  };
}

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

export function readConfig(): AppConfig {
  const dataMode = process.env.ERP_DATA_MODE === 'db' ? 'db' : 'memory';

  return {
    host: process.env.HOST ?? '127.0.0.1',
    port: readNumber(process.env.PORT, 3001),
    dataMode,
    database: {
      host: process.env.ERP_DB_HOST ?? '127.0.0.1',
      port: readNumber(process.env.ERP_DB_PORT, 5432),
      username: process.env.ERP_DB_USERNAME ?? 'postgres',
      password: process.env.ERP_DB_PASSWORD ?? 'postgres',
      name: process.env.ERP_DB_NAME ?? 'nba',
      schema: process.env.ERP_DB_SCHEMA ?? 'erp',
      synchronize: readBoolean(process.env.ERP_DB_SYNCHRONIZE, false),
    },
  };
}
