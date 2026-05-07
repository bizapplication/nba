import { accessSync, constants } from 'node:fs';
import { chromiumExecutablePath, getDemoConfig, runCommand, waitForPort } from './demo-shared.ts';

function requireDarwin() {
  if (process.platform !== 'darwin') {
    throw new Error('This local demo currently supports macOS only.');
  }
}

function requireNode24() {
  const major = Number(process.versions.node.split('.')[0]);

  if (major < 24) {
    throw new Error(`Node 24+ is required. Current version: ${process.version}`);
  }
}

async function requireCommand(command: string, args = ['--version']) {
  await runCommand(command, args, { stdio: 'pipe' });
}

async function canRunCommand(command: string, args = ['--version']) {
  try {
    await requireCommand(command, args);
    return true;
  } catch {
    return false;
  }
}

async function hasReachablePostgres(port: number) {
  try {
    await waitForPort(port, '127.0.0.1', 1_500);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const config = getDemoConfig();
  requireDarwin();
  requireNode24();
  await requireCommand('git');
  await requireCommand('pnpm');
  accessSync(config.repoRoot, constants.R_OK | constants.W_OK);

  const hasDocker = await canRunCommand('docker', ['version']);
  const hasLocalPostgres = await hasReachablePostgres(config.ports.postgres);

  if (!hasDocker && !hasLocalPostgres) {
    throw new Error(`Neither Docker nor a reachable PostgreSQL instance on 127.0.0.1:${config.ports.postgres} is available.`);
  }

  if (!config.openaiApiKey && !config.deepseekApiKey && !config.openclawAuthSourceHome) {
    throw new Error('Set DEEPSEEK_API_KEY or OPENAI_API_KEY before running the demo. OPENCLAW_AUTH_SOURCE_HOME is only an optional local fallback.');
  }

  const browserPath = chromiumExecutablePath();
  console.log(`doctor ok`);
  console.log(`repo: ${config.repoRoot}`);
  console.log(`openclaw model: ${config.openclawModel}`);
  console.log(`openclaw runtime mode: ${config.useGlobalOpenClawCli ? 'global-cli fallback' : 'repo-managed npm sidecar'}`);
  console.log(
    `openclaw auth source: ${
      config.deepseekApiKey
        ? 'DEEPSEEK_API_KEY'
        : config.openaiApiKey
          ? 'OPENAI_API_KEY'
          : (config.openclawAuthSourceHome ?? 'missing')
    }`
  );
  console.log(`postgres source: ${hasLocalPostgres ? `local ${config.ports.postgres}` : 'docker compose default'}`);
  console.log(`chromium executable: ${browserPath ?? 'auto-detect by OpenClaw'}`);
}

await main();
