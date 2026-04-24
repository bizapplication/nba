import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  AGENT_HOST: z.string().default('127.0.0.1'),
  AGENT_PORT: z.coerce.number().int().positive().default(3004),
  AGENT_DB_PATH: z.string().default(path.join(process.cwd(), '.data', 'agent.sqlite')),
  DEMO_REPO_ROOT: z.string().default(process.cwd()),
  DEMO_DATA_DIR: z.string().default(path.join(process.cwd(), '.data')),
  DEMO_JWT_SECRET: z.string().min(16),
  OPENCLAW_BASE_URL: z.string().default('http://127.0.0.1:18789'),
  OPENCLAW_GATEWAY_TOKEN: z.string().min(8),
  OPENCLAW_DEMO_MODEL: z.string().default('openai/gpt-5.4'),
  CRM_HOST: z.string().default('127.0.0.1'),
  CRM_PORT: z.coerce.number().int().positive().default(3002),
  ERP_HOST: z.string().default('127.0.0.1'),
  ERP_PORT: z.coerce.number().int().positive().default(3101),
  DEMO_COMMAND_ALLOWLIST: z.string().default('pnpm,git,ls,pwd,cat,rg,node,npm,npx')
});

const parsed = schema.parse(process.env);

export const env = {
  host: parsed.AGENT_HOST,
  port: parsed.AGENT_PORT,
  dbPath: parsed.AGENT_DB_PATH,
  repoRoot: parsed.DEMO_REPO_ROOT,
  dataDir: parsed.DEMO_DATA_DIR,
  jwtSecret: parsed.DEMO_JWT_SECRET,
  openclawBaseUrl: parsed.OPENCLAW_BASE_URL.replace(/\/$/, ''),
  openclawGatewayToken: parsed.OPENCLAW_GATEWAY_TOKEN,
  openclawModel: parsed.OPENCLAW_DEMO_MODEL,
  crmApiBase: `http://${parsed.CRM_HOST}:${parsed.CRM_PORT}`,
  erpApiBase: `http://${parsed.ERP_HOST}:${parsed.ERP_PORT}`,
  uploadDir: path.join(parsed.DEMO_REPO_ROOT, 'demo-files', 'uploads'),
  commandAllowlist: parsed.DEMO_COMMAND_ALLOWLIST.split(',').map((item) => item.trim()).filter(Boolean)
};
