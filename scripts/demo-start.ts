import {
  ensureDemoDirs,
  getDemoConfig,
  spawnManagedProcess,
  stopManagedProcesses,
  waitForHttp,
  waitForPort,
  writePidState
} from './demo-shared.ts';

async function main() {
  const config = getDemoConfig();
  ensureDemoDirs(config);
  await stopManagedProcesses(config);

  const baseEnv = {
    DEMO_REPO_ROOT: config.repoRoot,
    DEMO_DATA_DIR: config.dataDir,
    PLATFORM_DB_PATH: config.platformDbPath,
    AGENT_DB_PATH: config.agentDbPath,
    DEMO_ADMIN_EMAIL: config.adminEmail,
    DEMO_ADMIN_PASSWORD: config.adminPassword,
    DEMO_ADMIN_NAME: config.adminName,
    DEMO_JWT_SECRET: config.jwtSecret,
    OPENAI_API_KEY: config.openaiApiKey,
    OPENCLAW_GATEWAY_TOKEN: config.openclawGatewayToken,
    OPENCLAW_DEMO_MODEL: config.openclawModel,
    OPENCLAW_BASE_URL: `http://127.0.0.1:${config.ports.openclaw}`,
    OPENCLAW_HOME: config.openclawHomeDir,
    OPENCLAW_STATE_DIR: config.openclawHomeDir,
    OPENCLAW_CONFIG_PATH: config.openclawConfigPath,
    CRM_DB_HOST: process.env.CRM_DB_HOST || '127.0.0.1',
    CRM_DB_PORT: String(config.ports.postgres),
    CRM_DB_USER: process.env.CRM_DB_USER || 'postgres',
    CRM_DB_PASSWORD: process.env.CRM_DB_PASSWORD || 'postgres',
    CRM_DB_NAME: process.env.CRM_DB_NAME || 'nba',
    CRM_DB_SCHEMA: process.env.CRM_DB_SCHEMA || 'crm',
    NUXT_FINANCE_API_BASE: `http://127.0.0.1:${config.ports.erp}`,
    NUXT_CRM_API_BASE: `http://127.0.0.1:${config.ports.crm}`,
    NUXT_PLATFORM_API_BASE: `http://127.0.0.1:${config.ports.platform}`,
    NUXT_AGENT_API_BASE: `http://127.0.0.1:${config.ports.agent}`
  } satisfies NodeJS.ProcessEnv;

  const processes = [
    spawnManagedProcess('openclaw', 'pnpm', ['gateway:watch'], {
      cwd: config.runtimeCloneDir,
      env: baseEnv
    }),
    spawnManagedProcess('platform', 'pnpm', ['--filter', '@nba/platform', 'dev'], {
      cwd: config.repoRoot,
      env: {
        ...baseEnv,
        PLATFORM_HOST: '127.0.0.1',
        PLATFORM_PORT: String(config.ports.platform)
      }
    }),
    spawnManagedProcess('agent', 'pnpm', ['--filter', '@nba/agent', 'dev'], {
      cwd: config.repoRoot,
      env: {
        ...baseEnv,
        AGENT_HOST: '127.0.0.1',
        AGENT_PORT: String(config.ports.agent),
        CRM_HOST: '127.0.0.1',
        CRM_PORT: String(config.ports.crm),
        ERP_HOST: '127.0.0.1',
        ERP_PORT: String(config.ports.erp)
      }
    }),
    spawnManagedProcess('crm', 'pnpm', ['--filter', '@nba/crm', 'dev:db'], {
      cwd: config.repoRoot,
      env: {
        ...baseEnv,
        CRM_HOST: '127.0.0.1',
        CRM_PORT: String(config.ports.crm)
      }
    }),
    spawnManagedProcess('erp', 'pnpm', ['--filter', '@nba/erp', 'dev'], {
      cwd: config.repoRoot,
      env: {
        ...baseEnv,
        HOST: '127.0.0.1',
        PORT: String(config.ports.erp)
      }
    }),
    spawnManagedProcess('web', 'pnpm', ['exec', 'nuxt', 'dev', '--host', '127.0.0.1', '--port', String(config.ports.web)], {
      cwd: `${config.repoRoot}/apps/web`,
      env: {
        ...baseEnv,
        NUXT_PORT: String(config.ports.web)
      }
    })
  ];

  writePidState({ processes }, config);

  await waitForPort(config.ports.openclaw);
  await waitForHttp(`http://127.0.0.1:${config.ports.platform}/health`);
  await waitForHttp(`http://127.0.0.1:${config.ports.agent}/health`);
  await waitForHttp(`http://127.0.0.1:${config.ports.crm}/health`);
  await waitForHttp(`http://127.0.0.1:${config.ports.erp}/health`);
  await waitForHttp(`http://127.0.0.1:${config.ports.web}/home`);

  console.log(`web: http://127.0.0.1:${config.ports.web}/home`);
  console.log(`platform: http://127.0.0.1:${config.ports.platform}/health`);
  console.log(`agent: http://127.0.0.1:${config.ports.agent}/health`);
  console.log(`openclaw: http://127.0.0.1:${config.ports.openclaw}/v1/models`);
}

await main();
