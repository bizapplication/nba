import { accessSync, constants } from 'node:fs';
import { chromiumExecutablePath, getDemoConfig, runCommand } from './demo-shared.ts';

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

async function main() {
  const config = getDemoConfig();
  requireDarwin();
  requireNode24();
  await requireCommand('git');
  await requireCommand('pnpm');
  await requireCommand('docker', ['version']);
  accessSync(config.repoRoot, constants.R_OK | constants.W_OK);

  const browserPath = chromiumExecutablePath();
  console.log(`doctor ok`);
  console.log(`repo: ${config.repoRoot}`);
  console.log(`openclaw model: ${config.openclawModel}`);
  console.log(`chromium executable: ${browserPath ?? 'auto-detect by OpenClaw'}`);
}

await main();
