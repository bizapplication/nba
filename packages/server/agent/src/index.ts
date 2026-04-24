import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from './auth.ts';
import {
  addActionRequest,
  addAttachment,
  addMessage,
  closeDatabase,
  createRun,
  formatFileSize,
  getActionRequest,
  getRun,
  getSessionLink,
  listActionRequests,
  listAttachments,
  listMessages,
  listRuns,
  type ActionKind,
  type SessionLink,
  type StoredActionRequest,
  updateActionRequest,
  updateRun,
  upsertSessionLink
} from './db.ts';
import { env } from './env.ts';
import {
  listCustomers,
  listFinanceAccounts,
  listOpportunities,
  listOrders,
  listTransactions
} from './business-tools.ts';
import { callOpenClaw, type ClientToolDefinition } from './openclaw.ts';

const asyncExecFile = promisify(execFile);
const events = new EventEmitter();

fs.mkdirSync(env.uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, env.uploadDir);
    },
    filename: (_request, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      callback(null, `${Date.now()}-${randomUUID()}-${safeName}`);
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

function emitRunEvent(runId: string, type: string, payload: Record<string, unknown>) {
  events.emit(runId, {
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

function summarizePrompt(prompt: string) {
  const firstLine = prompt.trim().split('\n')[0] ?? '';
  return firstLine.slice(0, 80) || '未命名任务';
}

function sessionLinkFor(runId: string): SessionLink {
  const existing = getSessionLink(runId);

  if (existing) {
    return existing;
  }

  const link: SessionLink = {
    runId,
    readonlySessionKey: `readonly:${runId}`,
    operatorSessionKey: `operator:${runId}`,
    readonlyResponseId: null,
    operatorResponseId: null,
    updatedAt: new Date().toISOString()
  };
  upsertSessionLink(link);
  return link;
}

function readAttachmentNotes(runId: string) {
  const attachments = listAttachments(runId);

  if (!attachments.length) {
    return '';
  }

  return attachments
    .map((attachment) => `- ${attachment.name} (${attachment.sizeLabel}) -> ${attachment.storedPath}`)
    .join('\n');
}

function approvalToolDefinitions(): ClientToolDefinition[] {
  return [
    {
      type: 'function',
      function: {
        name: 'crm_list_customers',
        description: '读取 CRM 客户列表或按关键词搜索客户。',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 20 }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'crm_list_opportunities',
        description: '读取 CRM 商机列表或按关键词搜索商机。',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 20 }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'crm_list_orders',
        description: '读取 CRM 订单列表或按关键词搜索订单。',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 20 }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'erp_list_finance_accounts',
        description: '读取 ERP 财务账户列表。',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 20 }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'erp_list_transactions',
        description: '读取 ERP 财务交易列表。',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 20 }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'request_file_change',
        description: '当用户要求修改本地文件、代码或工作区内容时，生成一个待审批的文件操作请求。',
        parameters: {
          type: 'object',
          required: ['summary'],
          properties: {
            summary: { type: 'string' },
            targetPath: { type: 'string' }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'request_command_execution',
        description: '当用户要求执行本地命令时，生成一个待审批的命令执行请求。',
        parameters: {
          type: 'object',
          required: ['command'],
          properties: {
            command: { type: 'string' },
            cwd: { type: 'string' },
            summary: { type: 'string' }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'request_browser_action',
        description: '当用户要求打开网页、点击页面、输入、截图或浏览器自动化时，生成一个待审批的浏览器操作请求。',
        parameters: {
          type: 'object',
          required: ['targetUrl', 'goal'],
          properties: {
            targetUrl: { type: 'string' },
            goal: { type: 'string' }
          }
        }
      }
    }
  ];
}

function parseToolArguments(input: string) {
  try {
    return input ? JSON.parse(input) : {};
  } catch {
    return {};
  }
}

async function executeReadonlyTools(runId: string, messageId: string, toolCall: {
  call_id: string;
  name: string;
  arguments: string;
}) {
  const args = parseToolArguments(toolCall.arguments) as Record<string, unknown>;

  switch (toolCall.name) {
    case 'crm_list_customers':
      return { type: 'tool_result' as const, output: await listCustomers(args as { keyword?: string; limit?: number }) };
    case 'crm_list_opportunities':
      return { type: 'tool_result' as const, output: await listOpportunities(args as { keyword?: string; limit?: number }) };
    case 'crm_list_orders':
      return { type: 'tool_result' as const, output: await listOrders(args as { keyword?: string; limit?: number }) };
    case 'erp_list_finance_accounts':
      return { type: 'tool_result' as const, output: await listFinanceAccounts(args as { limit?: number }) };
    case 'erp_list_transactions':
      return { type: 'tool_result' as const, output: await listTransactions(args as { limit?: number }) };
    case 'request_file_change': {
      const actionId = randomUUID();
      addActionRequest({
        id: actionId,
        runId,
        messageId,
        kind: 'file',
        title: '待审批的文件操作',
        summary: String(args.summary || '请确认文件修改请求'),
        target: args.targetPath ? String(args.targetPath) : null,
        payloadJson: JSON.stringify(args),
        status: 'pending',
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resultSummary: null,
        errorMessage: null
      });
      return {
        type: 'tool_result' as const,
        output: {
          ok: true,
          content: JSON.stringify({
            requestId: actionId,
            status: 'pending',
            summary: args.summary,
            targetPath: args.targetPath ?? null
          })
        }
      };
    }
    case 'request_command_execution': {
      const actionId = randomUUID();
      addActionRequest({
        id: actionId,
        runId,
        messageId,
        kind: 'command',
        title: '待审批的命令执行',
        summary: String(args.summary || args.command || '请确认命令执行请求'),
        target: args.cwd ? String(args.cwd) : null,
        payloadJson: JSON.stringify(args),
        status: 'pending',
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resultSummary: null,
        errorMessage: null
      });
      return {
        type: 'tool_result' as const,
        output: {
          ok: true,
          content: JSON.stringify({
            requestId: actionId,
            status: 'pending',
            command: args.command,
            cwd: args.cwd ?? env.repoRoot
          })
        }
      };
    }
    case 'request_browser_action': {
      const actionId = randomUUID();
      addActionRequest({
        id: actionId,
        runId,
        messageId,
        kind: 'browser',
        title: '待审批的浏览器操作',
        summary: String(args.goal || '请确认浏览器自动化请求'),
        target: String(args.targetUrl || ''),
        payloadJson: JSON.stringify(args),
        status: 'pending',
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resultSummary: null,
        errorMessage: null
      });
      return {
        type: 'tool_result' as const,
        output: {
          ok: true,
          content: JSON.stringify({
            requestId: actionId,
            status: 'pending',
            targetUrl: args.targetUrl,
            goal: args.goal
          })
        }
      };
    }
    default:
      return {
        type: 'tool_result' as const,
        output: {
          ok: true,
          content: JSON.stringify({
            message: `Unknown tool ${toolCall.name}`
          })
        }
      };
  }
}

function readonlyInstructions(runId: string) {
  const attachmentNotes = readAttachmentNotes(runId);

  return [
    '你是 NBA 本地 Demo 的只读业务助理。',
    '你可以通过提供的 CRM/ERP 只读工具查询真实业务数据。',
    '你不能直接执行任何有副作用的动作。',
    '如果用户要求修改文件、执行命令或浏览器自动化，必须改为调用待审批请求工具，再向用户说明需要审批什么。',
    '回答要简洁、业务化，并明确指出你使用了哪些真实数据。',
    attachmentNotes ? `当前 run 已上传的文件：\n${attachmentNotes}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}

function operatorInstructions(action: StoredActionRequest) {
  return [
    '你是 NBA 本地 Demo 的操作型 Agent。',
    '当前动作已经获得用户审批，可以继续执行。',
    '仅允许在当前工作区内读写文件，不要访问工作区外路径。',
    '若是浏览器动作，只允许访问 localhost / 127.0.0.1。',
    `动作类型：${action.kind}`,
    `动作摘要：${action.summary}`,
    action.target ? `目标：${action.target}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function runReadonlyTurn(runId: string, messageId: string, prompt: string) {
  const link = sessionLinkFor(runId);
  let previousResponseId = link.readonlyResponseId;
  let currentInput: unknown = prompt;
  let assistantText = '';

  for (let step = 0; step < 8; step += 1) {
    const response = await callOpenClaw({
      agentId: 'nba-demo-readonly',
      sessionKey: link.readonlySessionKey,
      previousResponseId,
      instructions: readonlyInstructions(runId),
      input: currentInput,
      tools: approvalToolDefinitions()
    });

    previousResponseId = response.responseId;

    if (!response.functionCalls.length) {
      assistantText = response.text || '这次请求已经处理完成，但没有返回额外文本。';
      break;
    }

    const toolOutputs = [];

    for (const toolCall of response.functionCalls) {
      const result = await executeReadonlyTools(runId, messageId, toolCall);
      toolOutputs.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: result.output.content
      });
    }

    currentInput = toolOutputs;
  }

  upsertSessionLink({
    ...link,
    readonlyResponseId: previousResponseId,
    updatedAt: new Date().toISOString()
  });

  return assistantText;
}

async function runOperatorTurn(runId: string, action: StoredActionRequest) {
  if (action.kind === 'command') {
    const payload = JSON.parse(action.payloadJson) as {
      command?: string;
      cwd?: string;
    };
    const command = (payload.command || '').trim();
    const [bin, ...args] = command.split(/\s+/).filter(Boolean);

    if (!bin || !env.commandAllowlist.includes(bin)) {
      throw new Error(`Command not allowed in demo mode: ${command}`);
    }

    const result = await asyncExecFile(bin, args, {
      cwd: payload.cwd && payload.cwd.startsWith(env.repoRoot) ? payload.cwd : env.repoRoot,
      env: process.env,
      maxBuffer: 1024 * 1024
    });

    return [result.stdout, result.stderr].filter(Boolean).join('\n').trim() || 'Command completed without output.';
  }

  const link = sessionLinkFor(runId);
  const payload = JSON.parse(action.payloadJson) as Record<string, unknown>;
  const prompt = [
    `请执行以下已审批动作：${action.summary}`,
    action.kind === 'file' && payload.targetPath ? `目标路径：${String(payload.targetPath)}` : '',
    action.kind === 'browser' && payload.targetUrl ? `目标网址：${String(payload.targetUrl)}` : '',
    action.kind === 'browser' && payload.goal ? `动作目标：${String(payload.goal)}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const response = await callOpenClaw({
    agentId: 'nba-demo-operator',
    sessionKey: link.operatorSessionKey,
    previousResponseId: link.operatorResponseId,
    instructions: operatorInstructions(action),
    input: prompt
  });

  upsertSessionLink({
    ...link,
    operatorResponseId: response.responseId,
    updatedAt: new Date().toISOString()
  });

  return response.text || 'Action completed.';
}

function serializeRun(runId: string) {
  const run = getRun(runId);

  if (!run) {
    return null;
  }

  return {
    ...run,
    messages: listMessages(runId),
    attachments: listAttachments(runId).map((attachment) => ({
      ...attachment,
      downloadPath: attachment.storedPath
    })),
    actionRequests: listActionRequests(runId).map((action) => ({
      ...action,
      payload: JSON.parse(action.payloadJson)
    }))
  };
}

function saveUploadedFiles(runId: string, messageId: string, files: Express.Multer.File[] | undefined) {
  for (const file of files ?? []) {
    addAttachment({
      id: randomUUID(),
      runId,
      messageId,
      name: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      storedPath: file.path,
      sizeLabel: formatFileSize(file.size),
      createdAt: new Date().toISOString()
    });
  }
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'agent'
  });
});

app.get('/api/runs', requireAuth, (request, response) => {
  const user = (request as AuthenticatedRequest).user;
  response.json({
    data: listRuns(user.sub)
  });
});

app.get('/api/runs/:id', requireAuth, (request, response) => {
  const run = serializeRun(request.params.id);

  if (!run) {
    response.status(404).json({ message: 'Run not found' });
    return;
  }

  response.json(run);
});

app.post('/api/runs', requireAuth, upload.array('files', 10), async (request, response) => {
  const user = (request as AuthenticatedRequest).user;
  const prompt = String(request.body.prompt || '').trim();
  const model = String(request.body.model || env.openclawModel).trim();

  if (!prompt) {
    response.status(400).json({ message: 'Prompt is required' });
    return;
  }

  const runId = randomUUID();
  const messageId = randomUUID();

  createRun({
    id: runId,
    userId: user.sub,
    title: summarizePrompt(prompt),
    model,
    promptPreview: prompt
  });
  addMessage({
    id: messageId,
    runId,
    role: 'user',
    content: prompt,
    createdAt: new Date().toISOString()
  });
  saveUploadedFiles(runId, messageId, request.files as Express.Multer.File[] | undefined);

  try {
    const assistantText = await runReadonlyTurn(runId, messageId, prompt);
    addMessage({
      id: randomUUID(),
      runId,
      role: 'assistant',
      content: assistantText,
      createdAt: new Date().toISOString()
    });
    const actionRequests = listActionRequests(runId);
    updateRun({
      id: runId,
      status: actionRequests.some((item) => item.status === 'pending') ? 'blocked' : 'completed',
      summary: assistantText.slice(0, 220)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected agent failure';
    addMessage({
      id: randomUUID(),
      runId,
      role: 'assistant',
      content: `本次请求没有成功完成：${message}`,
      createdAt: new Date().toISOString()
    });
    updateRun({
      id: runId,
      status: 'blocked',
      summary: message
    });
  }

  emitRunEvent(runId, 'run.updated', serializeRun(runId) ?? {});
  response.status(201).json(serializeRun(runId));
});

app.post('/api/runs/:id/messages', requireAuth, upload.array('files', 10), async (request, response) => {
  const runId = request.params.id;
  const run = getRun(runId);

  if (!run) {
    response.status(404).json({ message: 'Run not found' });
    return;
  }

  const prompt = String(request.body.prompt || '').trim();

  if (!prompt) {
    response.status(400).json({ message: 'Prompt is required' });
    return;
  }

  const userMessageId = randomUUID();
  addMessage({
    id: userMessageId,
    runId,
    role: 'user',
    content: prompt,
    createdAt: new Date().toISOString()
  });
  saveUploadedFiles(runId, userMessageId, request.files as Express.Multer.File[] | undefined);
  updateRun({
    id: runId,
    status: 'running',
    promptPreview: prompt
  });

  try {
    const assistantText = await runReadonlyTurn(runId, userMessageId, prompt);
    addMessage({
      id: randomUUID(),
      runId,
      role: 'assistant',
      content: assistantText,
      createdAt: new Date().toISOString()
    });
    const actionRequests = listActionRequests(runId);
    updateRun({
      id: runId,
      status: actionRequests.some((item) => item.status === 'pending') ? 'blocked' : 'completed',
      summary: assistantText.slice(0, 220)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected agent failure';
    addMessage({
      id: randomUUID(),
      runId,
      role: 'assistant',
      content: `本次追问没有成功完成：${message}`,
      createdAt: new Date().toISOString()
    });
    updateRun({
      id: runId,
      status: 'blocked',
      summary: message
    });
  }

  emitRunEvent(runId, 'run.updated', serializeRun(runId) ?? {});
  response.json(serializeRun(runId));
});

app.post('/api/runs/:id/action-requests/:requestId/approve', requireAuth, async (request, response) => {
  const runId = request.params.id;
  const action = getActionRequest(request.params.requestId);

  if (!action || action.runId !== runId) {
    response.status(404).json({ message: 'Action request not found' });
    return;
  }

  updateActionRequest({
    id: action.id,
    status: 'approved'
  });

  try {
    const resultSummary = await runOperatorTurn(runId, {
      ...action,
      status: 'approved'
    });
    updateActionRequest({
      id: action.id,
      status: 'completed',
      resultSummary
    });
    addMessage({
      id: randomUUID(),
      runId,
      role: 'assistant',
      content: `审批通过并已执行：${resultSummary}`,
      createdAt: new Date().toISOString()
    });
    updateRun({
      id: runId,
      status: 'completed',
      summary: resultSummary.slice(0, 220)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action execution failed';
    updateActionRequest({
      id: action.id,
      status: 'failed',
      errorMessage: message
    });
    addMessage({
      id: randomUUID(),
      runId,
      role: 'assistant',
      content: `审批后执行失败：${message}`,
      createdAt: new Date().toISOString()
    });
    updateRun({
      id: runId,
      status: 'blocked',
      summary: message
    });
  }

  emitRunEvent(runId, 'run.updated', serializeRun(runId) ?? {});
  response.json(serializeRun(runId));
});

app.post('/api/runs/:id/action-requests/:requestId/reject', requireAuth, (request, response) => {
  const runId = request.params.id;
  const action = getActionRequest(request.params.requestId);

  if (!action || action.runId !== runId) {
    response.status(404).json({ message: 'Action request not found' });
    return;
  }

  updateActionRequest({
    id: action.id,
    status: 'rejected',
    resultSummary: '用户已拒绝本次动作。'
  });
  addMessage({
    id: randomUUID(),
    runId,
    role: 'assistant',
    content: `动作已被拒绝：${action.summary}`,
    createdAt: new Date().toISOString()
  });
  updateRun({
    id: runId,
    status: 'blocked',
    summary: '有动作请求被拒绝，等待新的指令。'
  });
  emitRunEvent(runId, 'run.updated', serializeRun(runId) ?? {});
  response.json(serializeRun(runId));
});

app.get('/api/runs/:id/events', requireAuth, (request, response) => {
  const runId = request.params.id;
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.flushHeaders?.();

  const handler = (event: { type: string; payload: unknown; timestamp: string }) => {
    response.write(`event: ${event.type}\n`);
    response.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  events.on(runId, handler);
  handler({
    type: 'run.snapshot',
    payload: serializeRun(runId),
    timestamp: new Date().toISOString()
  });

  request.on('close', () => {
    events.off(runId, handler);
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

const server = app.listen(env.port, env.host, () => {
  console.log(`Agent service listening on http://${env.host}:${env.port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down agent service...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
