import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

export interface DemoConfig {
  repoRoot: string;
  runtimeDir: string;
  runtimeCloneDir: string;
  openclawHomeDir: string;
  dataDir: string;
  demoFilesDir: string;
  uploadDir: string;
  logsDir: string;
  pidFile: string;
  platformDbPath: string;
  agentDbPath: string;
  openclawConfigPath: string;
  openclawWorkspace: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  jwtSecret: string;
  openaiApiKey: string;
  openclawGatewayToken: string;
  openclawModel: string;
  ports: {
    web: number;
    crm: number;
    platform: number;
    agent: number;
    erp: number;
    openclaw: number;
    postgres: number;
  };
  commandAllowlist: string[];
}

export interface ManagedProcess {
  name: string;
  pid: number;
  logPath: string;
}

export interface PidState {
  processes: ManagedProcess[];
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalNumber(name: string, fallback: number) {
  const value = process.env[name]?.trim();
  return value ? Number(value) : fallback;
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function getDemoConfig(): DemoConfig {
  const repoRoot = process.cwd();
  const runtimeDir = path.join(repoRoot, '.runtime');
  const runtimeCloneDir = path.join(runtimeDir, 'openclaw');
  const openclawHomeDir = path.join(runtimeDir, 'openclaw-home');
  const dataDir = path.join(repoRoot, '.data');
  const demoFilesDir = path.join(repoRoot, 'demo-files');
  const uploadDir = path.join(demoFilesDir, 'uploads');
  const logsDir = path.join(runtimeDir, 'logs');

  return {
    repoRoot,
    runtimeDir,
    runtimeCloneDir,
    openclawHomeDir,
    dataDir,
    demoFilesDir,
    uploadDir,
    logsDir,
    pidFile: path.join(runtimeDir, 'demo-processes.json'),
    platformDbPath: path.join(dataDir, 'platform.sqlite'),
    agentDbPath: path.join(dataDir, 'agent.sqlite'),
    openclawConfigPath: path.join(openclawHomeDir, 'config', 'openclaw.json5'),
    openclawWorkspace: repoRoot,
    adminEmail: requiredEnv('DEMO_ADMIN_EMAIL'),
    adminPassword: requiredEnv('DEMO_ADMIN_PASSWORD'),
    adminName: process.env.DEMO_ADMIN_NAME?.trim() || 'NBA Demo Admin',
    jwtSecret: requiredEnv('DEMO_JWT_SECRET'),
    openaiApiKey: requiredEnv('OPENAI_API_KEY'),
    openclawGatewayToken: requiredEnv('OPENCLAW_GATEWAY_TOKEN'),
    openclawModel: process.env.OPENCLAW_DEMO_MODEL?.trim() || 'openai/gpt-5.4',
    ports: {
      web: optionalNumber('DEMO_WEB_PORT', 3000),
      crm: optionalNumber('DEMO_CRM_PORT', 3002),
      platform: optionalNumber('DEMO_PLATFORM_PORT', 3003),
      agent: optionalNumber('DEMO_AGENT_PORT', 3004),
      erp: optionalNumber('DEMO_ERP_PORT', 3101),
      openclaw: optionalNumber('DEMO_OPENCLAW_PORT', 18789),
      postgres: optionalNumber('CRM_DB_PORT', 5432)
    },
    commandAllowlist: (process.env.DEMO_COMMAND_ALLOWLIST || 'pnpm,git,ls,pwd,cat,rg,node,npm,npx')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

export function ensureDemoDirs(config: DemoConfig) {
  [
    config.runtimeDir,
    config.dataDir,
    config.demoFilesDir,
    config.uploadDir,
    config.logsDir,
    path.dirname(config.openclawConfigPath)
  ].forEach(ensureDir);
}

export async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: 'inherit' | 'pipe';
  } = {}
) {
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env
      },
      stdio: options.stdio ?? 'inherit',
      shell: false
    });

    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });

  if (exitCode !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${exitCode}`);
  }
}

export async function waitForPort(port: number, host = '127.0.0.1', timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const open = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ port, host });

      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });

      socket.once('error', () => {
        resolve(false);
      });
    });

    if (open) {
      return;
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${host}:${port}`);
}

export async function waitForHttp(
  url: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
  } = {}
) {
  const deadline = Date.now() + (options.timeoutMs ?? 60_000);

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        headers: options.headers
      });

      if (response.ok) {
        return;
      }
    } catch {}

    await delay(800);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export function spawnManagedProcess(
  name: string,
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } = {}
): ManagedProcess {
  const config = getDemoConfig();
  ensureDemoDirs(config);
  const logPath = path.join(config.logsDir, `${name}.log`);
  const logFd = fs.openSync(logPath, 'a');
  const child = spawn(command, args, {
    cwd: options.cwd ?? config.repoRoot,
    env: {
      ...process.env,
      ...options.env
    },
    detached: true,
    stdio: ['ignore', logFd, logFd],
    shell: false
  });

  child.unref();

  return {
    name,
    pid: child.pid ?? -1,
    logPath
  };
}

export function writePidState(state: PidState, config = getDemoConfig()) {
  ensureDemoDirs(config);
  fs.writeFileSync(config.pidFile, JSON.stringify(state, null, 2));
}

export function readPidState(config = getDemoConfig()): PidState {
  if (!fs.existsSync(config.pidFile)) {
    return { processes: [] };
  }

  return JSON.parse(fs.readFileSync(config.pidFile, 'utf8')) as PidState;
}

export function killManagedProcess(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  try {
    process.kill(-pid, 'SIGTERM');
  } catch {}

  try {
    process.kill(pid, 'SIGTERM');
  } catch {}
}

export async function stopManagedProcesses(config = getDemoConfig()) {
  const state = readPidState(config);

  for (const processInfo of state.processes) {
    killManagedProcess(processInfo.pid);
  }

  if (fs.existsSync(config.pidFile)) {
    fs.rmSync(config.pidFile, { force: true });
  }

  await delay(800);
}

export function chromiumExecutablePath() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}
