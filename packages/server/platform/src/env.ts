import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  PLATFORM_HOST: z.string().default('127.0.0.1'),
  PLATFORM_PORT: z.coerce.number().int().positive().default(3003),
  PLATFORM_DB_PATH: z.string().default(path.join(process.cwd(), '.data', 'platform.sqlite')),
  DEMO_ADMIN_EMAIL: z.string().email(),
  DEMO_ADMIN_PASSWORD: z.string().min(8),
  DEMO_ADMIN_NAME: z.string().default('NBA Demo Admin'),
  DEMO_JWT_SECRET: z.string().min(16)
});

const parsed = schema.parse(process.env);

export const env = {
  host: parsed.PLATFORM_HOST,
  port: parsed.PLATFORM_PORT,
  dbPath: parsed.PLATFORM_DB_PATH,
  adminEmail: parsed.DEMO_ADMIN_EMAIL,
  adminPassword: parsed.DEMO_ADMIN_PASSWORD,
  adminName: parsed.DEMO_ADMIN_NAME,
  jwtSecret: parsed.DEMO_JWT_SECRET
};
