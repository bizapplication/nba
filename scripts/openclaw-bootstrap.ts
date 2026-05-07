import fs from 'node:fs';
import path from 'node:path';
import {
  chromiumExecutablePath,
  ensureDemoDirs,
  getDemoConfig,
  runCommand
} from './demo-shared.ts';

const OPENCLAW_VERSION = '2026.4.24';

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function resetConfigSnapshots(configPath: string) {
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    return;
  }

  for (const entry of fs.readdirSync(configDir)) {
    if (
      entry === 'config-health.json' ||
      entry.startsWith('openclaw.json5.bak') ||
      entry.startsWith('openclaw.json5.last-good') ||
      entry.startsWith('openclaw.json5.clobbered.')
    ) {
      fs.rmSync(path.join(configDir, entry), { force: true, recursive: true });
    }
  }
}

function resetLegacyRuntimeIfNeeded(runtimeInstallDir: string) {
  const legacyGitDir = path.join(runtimeInstallDir, '.git');
  const packageJsonPath = path.join(runtimeInstallDir, 'package.json');

  if (fs.existsSync(legacyGitDir)) {
    fs.rmSync(runtimeInstallDir, { recursive: true, force: true });
    return;
  }

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name?: string };

    if (packageJson.name !== 'nba-openclaw-runtime') {
      fs.rmSync(runtimeInstallDir, { recursive: true, force: true });
    }
  } catch {
    fs.rmSync(runtimeInstallDir, { recursive: true, force: true });
  }
}

function configTemplate() {
  const config = getDemoConfig();
  const browserExecutable = chromiumExecutablePath();
  const usesDeepSeek = config.openclawModel.startsWith('deepseek/');

  const executablePath = browserExecutable
    ? `    executablePath: ${JSON.stringify(browserExecutable)},\n`
    : '';

  const deepSeekAgentModels = usesDeepSeek
    ? `
      models: {
        "deepseek/deepseek-v4-flash": {
          alias: "DeepSeek",
        },
      },
`
    : '';

  const deepSeekProviderConfig = usesDeepSeek
    ? `,

  models: {
    mode: "merge",
    providers: {
      deepseek: {
        baseUrl: "https://api.deepseek.com",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash",
            reasoning: true,
            input: ["text"],
            contextWindow: 1000000,
            maxTokens: 384000,
            cost: {
              input: 0.14,
              output: 0.28,
              cacheRead: 0.028,
              cacheWrite: 0,
            },
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
            },
          },
          {
            id: "deepseek-v4-pro",
            name: "DeepSeek V4 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1000000,
            maxTokens: 384000,
            cost: {
              input: 1.74,
              output: 3.48,
              cacheRead: 0.145,
              cacheWrite: 0,
            },
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
            },
          },
          {
            id: "deepseek-chat",
            name: "DeepSeek Chat",
            reasoning: false,
            input: ["text"],
            contextWindow: 131072,
            maxTokens: 8192,
            cost: {
              input: 0.28,
              output: 0.42,
              cacheRead: 0.028,
              cacheWrite: 0,
            },
            compat: {
              supportsUsageInStreaming: true,
              maxTokensField: "max_tokens",
            },
          },
          {
            id: "deepseek-reasoner",
            name: "DeepSeek Reasoner",
            reasoning: true,
            input: ["text"],
            contextWindow: 131072,
            maxTokens: 65536,
            cost: {
              input: 0.28,
              output: 0.42,
              cacheRead: 0.028,
              cacheWrite: 0,
            },
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: false,
              maxTokensField: "max_tokens",
            },
          },
        ],
      },
    },
  }`
    : '';

  return `{
  session: {
    dmScope: "per-channel-peer",
  },

  agents: {
    defaults: {
      workspace: ${JSON.stringify(config.openclawWorkspace)},
      model: {
        primary: ${JSON.stringify(config.openclawModel)},
      },
${deepSeekAgentModels}      userTimezone: "Asia/Shanghai",
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

  discovery: {
    mdns: {
      mode: "off",
    },
  },

  gateway: {
    mode: "local",
    bind: "loopback",
    port: ${config.ports.openclaw},
    auth: {
      mode: "token",
      token: ${JSON.stringify(config.openclawGatewayToken)},
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
  }${deepSeekProviderConfig},
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

async function ensureRuntimeInstalled() {
  const config = getDemoConfig();

  if (config.useGlobalOpenClawCli) {
    return;
  }

  resetLegacyRuntimeIfNeeded(config.runtimeInstallDir);
  fs.mkdirSync(config.runtimeInstallDir, { recursive: true });
  fs.writeFileSync(
    path.join(config.runtimeInstallDir, 'package.json'),
    JSON.stringify(
      {
        name: 'nba-openclaw-runtime',
        private: true,
        packageManager: 'pnpm@10.30.3',
        dependencies: {
          openclaw: OPENCLAW_VERSION
        },
        pnpm: {
          onlyBuiltDependencies: ['openclaw', 'sharp', 'protobufjs', 'koffi']
        }
      },
      null,
      2
    )
  );

  await runCommand('pnpm', ['install', '--dir', config.runtimeInstallDir, '--ignore-workspace', '--no-frozen-lockfile'], {
    cwd: config.repoRoot
  });
}

function copyIfPresent(sourcePath: string, targetPath: string) {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  ensureParentDir(targetPath);
  fs.copyFileSync(sourcePath, targetPath);
  return true;
}

function bootstrapFromExistingOpenClawHome() {
  const config = getDemoConfig();

  if (!config.openclawAuthSourceHome) {
    return false;
  }

  const sourceAgentDir = path.join(config.openclawAuthSourceHome, 'agents', 'main', 'agent');
  const targetAgentDir = path.join(config.openclawHomeDir, 'agents', 'main', 'agent');
  const copiedAuth = copyIfPresent(
    path.join(sourceAgentDir, 'auth-profiles.json'),
    path.join(targetAgentDir, 'auth-profiles.json')
  );
  const copiedModels = copyIfPresent(
    path.join(sourceAgentDir, 'models.json'),
    path.join(targetAgentDir, 'models.json')
  );

  return copiedAuth || copiedModels;
}

async function bootstrapAuthProfile() {
  const config = getDemoConfig();
  const usesOpenAi = config.openclawModel.startsWith('openai/');
  const usesDeepSeek = config.openclawModel.startsWith('deepseek/');
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

  if (bootstrapFromExistingOpenClawHome()) {
    return;
  }

  if (usesDeepSeek && config.deepseekApiKey) {
    return;
  }

  if (usesOpenAi && config.openaiApiKey) {
    return;
  }

  if (!config.openaiApiKey && !config.deepseekApiKey) {
    throw new Error(
      'No existing OpenClaw auth profile was found and no provider API key is set. ' +
      'Set DEEPSEEK_API_KEY or OPENAI_API_KEY, or configure OPENCLAW_AUTH_SOURCE_HOME to an existing OpenClaw home.'
    );
  }

  const env = {
    ...process.env,
    OPENCLAW_HOME: config.openclawHomeDir,
    OPENCLAW_STATE_DIR: config.openclawHomeDir,
    OPENCLAW_CONFIG_PATH: config.openclawConfigPath,
    OPENAI_API_KEY: config.openaiApiKey ?? undefined,
    DEEPSEEK_API_KEY: config.deepseekApiKey ?? undefined,
    OPENCLAW_GATEWAY_TOKEN: config.openclawGatewayToken
  };

  await runCommand(
    config.useGlobalOpenClawCli ? 'openclaw' : 'pnpm',
    config.useGlobalOpenClawCli
      ? [
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
        ]
      : [
          'exec',
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
      cwd: config.useGlobalOpenClawCli ? config.repoRoot : config.runtimeInstallDir,
      env
    }
  );
}

async function main() {
  const config = getDemoConfig();
  ensureDemoDirs(config);
  await ensureRuntimeInstalled();
  fs.mkdirSync(path.join(config.openclawHomeDir, 'config'), { recursive: true });
  await bootstrapAuthProfile();
  resetConfigSnapshots(config.openclawConfigPath);
  fs.writeFileSync(config.openclawConfigPath, configTemplate());
  fs.writeFileSync(path.join(config.openclawHomeDir, 'exec-approvals.json'), approvalsTemplate());
  console.log(`OpenClaw runtime ready at ${config.runtimeInstallDir}`);
}

await main();
