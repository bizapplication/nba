import { ensureDemoDirs, getDemoConfig, runCommand, waitForPort } from './demo-shared.ts';

async function main() {
  const config = getDemoConfig();
  ensureDemoDirs(config);
  await runCommand('node', ['--env-file=.env', '--experimental-strip-types', 'scripts/demo-doctor.ts'], {
    cwd: config.repoRoot
  });
  await runCommand('pnpm', ['install'], { cwd: config.repoRoot });
  await runCommand('docker', ['compose', '-f', 'database/docker-compose.yml', 'up', '-d'], {
    cwd: config.repoRoot
  });
  await waitForPort(config.ports.postgres);
  await runCommand('node', ['--env-file=.env', '--experimental-strip-types', 'scripts/openclaw-bootstrap.ts'], {
    cwd: config.repoRoot
  });
  await runCommand('node', ['--env-file=.env', '--experimental-strip-types', 'scripts/demo-seed.ts'], {
    cwd: config.repoRoot
  });
  console.log('demo setup complete');
}

await main();
