import { getDemoConfig, runCommand } from './demo-shared.ts';

const config = getDemoConfig();

await runCommand('pnpm', ['seed:crm:demo'], {
  cwd: config.repoRoot,
  env: {
    CRM_DB_HOST: process.env.CRM_DB_HOST || '127.0.0.1',
    CRM_DB_PORT: String(config.ports.postgres),
    CRM_DB_USER: process.env.CRM_DB_USER || 'postgres',
    CRM_DB_PASSWORD: process.env.CRM_DB_PASSWORD || 'postgres',
    CRM_DB_NAME: process.env.CRM_DB_NAME || 'nba',
    CRM_DB_SCHEMA: process.env.CRM_DB_SCHEMA || 'crm'
  }
});
