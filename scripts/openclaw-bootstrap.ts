import fs from 'node:fs';
import path from 'node:path';
import {
  chromiumExecutablePath,
  ensureDemoDirs,
  getDemoConfig,
  runCommand
} from './demo-shared.ts';

const OPENCLAW_REPO = 'https://github.com/openclaw/openclaw.git';
const OPENCLAW_TAG = 'v2026.4.14';

function configTemplate() {
  const config = getDemoConfig();
  const browserExecutable = chromiumExecutablePath();

  const executablePath = browserExecutable
    ? `    executablePath: ${JSON.stringify(browserExecutable)},\n`
    : '';

  return `{
  identity: {
    name: "NBA Demo Agent",
    theme: "business copilot",
    emoji: "🏀",
  },

  session: {
    dmScope: "per-channel-peer",
  },

  agents: {
    defaults: {
      workspace: ${JSON.stringify(config.openclawWorkspace)},
      model: {
        primary: ${JSON.stringify(config.openclawModel)},
      },
      userTimezone: "Asia/Shanghai",
      sandbox: {
        mode: "off",
      },
    },
    list: [
      {
        id: "nba-demo-readonly",
        workspace: ${JSON.stringify(config.openclawWorkspace)},
        sandbox: {
          mode: "off",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read", "web_fetch", "sessions_list", "sessions_history", "session_status"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser", "canvas"],
        },
      },
      {
        id: "nba-demo-operator",
        workspace: ${JSON.stringify(config.openclawWorkspace)},
        sandbox: {
          mode: "off",
          scope: "agent",
          workspaceAccess: "rw",
        },
        tools: {
          allow: ["read", "write", "edit", "apply_patch", "exec", "process", "browser", "sessions_list", "sessions_history", "session_status"],
          deny: ["canvas", "cron", "nodes", "gateway"],
        },
      },
    ],
  },

  tools: {
    fs: {
      workspaceOnly: true,
    },
    exec: {
      security: "allowlist",
      ask: "off",
      askFallback: "deny",
      strictInlineEval: true,
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      applyPatch: {
        workspaceOnly: true,
        enabled: true,
      },
    },
  },

  browser: {
    enabled: true,
    defaultProfile: "openclaw-demo",
    headless: false,
    ssrfPolicy: {
      hostnameAllowlist: ["localhost"],
      allowedHostnames: ["localhost", "127.0.0.1"],
    },
${executablePath}    profiles: {
      "openclaw-demo": {
        cdpPort: ${config.ports.openclaw + 11},
        color: "#F97316",
      },
    },
  },

  gateway: {
    mode: "local",
    bind: "loopback",
    port: ${config.ports.openclaw},
    auth: {
      mode: "token",
      token: "\${OPENCLAW_GATEWAY_TOKEN}",
    },
    controlUi: {
      enabled: false,
    },
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
        },
        responses: {
          enabled: true,
          files: {
            allowUrl: false,
          },
          images: {
            allowUrl: false,
          },
        },
      },
    },
  },
}
`;
}

function approvalsTemplate() {
  const config = getDemoConfig();

  return JSON.stringify(
    {
      version: 1,
      defaults: {
        security: 'allowlist',
        ask: 'off',
        askFallback: 'deny',
        autoAllowSkills: false
      },
      agents: {
        'nba-demo-operator': {
          security: 'allowlist',
          ask: 'off',
          askFallback: 'deny',
          autoAllowSkills: false,
          allowlist: config.commandAllowlist.map((command) => ({
            pattern: `**/${command}`,
            lastUsedCommand: command
          }))
        }
      }
    },
    null,
    2
  );
}

async function cloneOrUpdateRuntime() {
  const config = getDemoConfig();

  if (!fs.existsSync(config.runtimeCloneDir)) {
    await runCommand('git', ['clone', OPENCLAW_REPO, config.runtimeCloneDir], {
      cwd: config.repoRoot
    });
  }

  await runCommand('git', ['fetch', '--tags', '--force'], {
    cwd: config.runtimeCloneDir
  });
  await runCommand('git', ['checkout', OPENCLAW_TAG], {
    cwd: config.runtimeCloneDir
  });
  await runCommand('pnpm', ['install'], {
    cwd: config.runtimeCloneDir
  });
}

async function bootstrapAuthProfile() {
  const config = getDemoConfig();
  const authProfilesPath = path.join(
    config.openclawHomeDir,
    'agents',
    'main',
    'agent',
    'auth-profiles.json'
  );

  if (fs.existsSync(authProfilesPath)) {
    return;
  }

  const env = {
    ...process.env,
    OPENCLAW_HOME: config.openclawHomeDir,
    OPENCLAW_STATE_DIR: config.openclawHomeDir,
    OPENCLAW_CONFIG_PATH: config.openclawConfigPath,
    OPENAI_API_KEY: config.openaiApiKey,
    OPENCLAW_GATEWAY_TOKEN: config.openclawGatewayToken
  };

  await runCommand(
    'pnpm',
    [
      'openclaw',
      'onboard',
      '--non-interactive',
      '--mode',
      'local',
      '--auth-choice',
      'openai-api-key',
      '--secret-input-mode',
      'ref',
      '--workspace',
      config.openclawWorkspace,
      '--gateway-auth',
      'token',
      '--gateway-token-ref-env',
      'OPENCLAW_GATEWAY_TOKEN',
      '--gateway-port',
      String(config.ports.openclaw),
      '--gateway-bind',
      'loopback',
      '--skip-health',
      '--skip-skills',
      '--accept-risk'
    ],
    {
      cwd: config.runtimeCloneDir,
      env
    }
  );
}

async function main() {
  const config = getDemoConfig();
  ensureDemoDirs(config);
  await cloneOrUpdateRuntime();
  fs.mkdirSync(path.join(config.openclawHomeDir, 'config'), { recursive: true });
  await bootstrapAuthProfile();
  fs.writeFileSync(config.openclawConfigPath, configTemplate());
  fs.writeFileSync(path.join(config.openclawHomeDir, 'exec-approvals.json'), approvalsTemplate());
  console.log(`OpenClaw runtime ready at ${config.runtimeCloneDir}`);
}

await main();
