import { getDemoConfig, runCommand, stopManagedProcesses } from './demo-shared.ts';

const config = getDemoConfig();
await stopManagedProcesses(config);

try {
  await runCommand('docker', ['compose', '-f', 'database/docker-compose.yml', 'stop'], {
    cwd: config.repoRoot
  });
} catch (error) {
  console.warn(`docker compose stop skipped: ${error instanceof Error ? error.message : String(error)}`);
}

console.log('demo stopped');
