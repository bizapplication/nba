import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

function toBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) return fallback;
  const value = input.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(value)) return false;
  return fallback;
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CRM_HOST: z.string().default('0.0.0.0'),
  CRM_PORT: z.coerce.number().int().positive().default(3002),
  CRM_DB_HOST: z.string().default('127.0.0.1'),
  CRM_DB_PORT: z.coerce.number().int().positive().default(5432),
  CRM_DB_USER: z.string().default('nba'),
  CRM_DB_PASSWORD: z.string().default('nba'),
  CRM_DB_NAME: z.string().default('crm_db'),
  CRM_DB_SSL: z.string().optional(),
  CRM_DB_SYNC: z.string().optional(),
  CRM_DB_LOGGING: z.string().optional(),
});

const raw = EnvSchema.parse(process.env);

export const env = {
  nodeEnv: raw.NODE_ENV,
  host: raw.CRM_HOST,
  port: raw.CRM_PORT,
  db: {
    host: raw.CRM_DB_HOST,
    port: raw.CRM_DB_PORT,
    user: raw.CRM_DB_USER,
    password: raw.CRM_DB_PASSWORD,
    database: raw.CRM_DB_NAME,
    ssl: toBoolean(raw.CRM_DB_SSL, false),
    synchronize: toBoolean(raw.CRM_DB_SYNC, false),
    logging: toBoolean(raw.CRM_DB_LOGGING, false),
  },
};
