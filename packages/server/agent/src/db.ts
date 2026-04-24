import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from './env.ts';

export type RunStatus = 'queued' | 'running' | 'completed' | 'blocked';
export type ActionKind = 'file' | 'command' | 'browser';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
export type MessageRole = 'system' | 'user' | 'assistant';

export interface StoredRun {
  id: string;
  userId: string;
  title: string;
  status: RunStatus;
  model: string;
  promptPreview: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
}

export interface StoredMessage {
  id: string;
  runId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface StoredAttachment {
  id: string;
  runId: string;
  messageId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  sizeLabel: string;
  createdAt: string;
}

export interface StoredActionRequest {
  id: string;
  runId: string;
  messageId: string;
  kind: ActionKind;
  title: string;
  summary: string;
  target: string | null;
  payloadJson: string;
  status: ActionStatus;
  requestedAt: string;
  updatedAt: string;
  resultSummary: string | null;
  errorMessage: string | null;
}

export interface SessionLink {
  runId: string;
  readonlySessionKey: string;
  operatorSessionKey: string;
  readonlyResponseId: string | null;
  operatorResponseId: string | null;
  updatedAt: string;
}

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
fs.mkdirSync(env.uploadDir, { recursive: true });

export const db = new DatabaseSync(env.dbPath);
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_preview TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    stored_path TEXT NOT NULL,
    size_label TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS action_requests (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    target TEXT,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    result_summary TEXT,
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS session_links (
    run_id TEXT PRIMARY KEY,
    readonly_session_key TEXT NOT NULL,
    operator_session_key TEXT NOT NULL,
    readonly_response_id TEXT,
    operator_response_id TEXT,
    updated_at TEXT NOT NULL
  );
`);

function now() {
  return new Date().toISOString();
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${Math.max(1, sizeBytes)} B`;
}

export function createRun(input: {
  id: string;
  userId: string;
  title: string;
  model: string;
  promptPreview: string;
}) {
  const timestamp = now();
  db.prepare(`
    INSERT INTO runs (id, user_id, title, status, model, prompt_preview, summary, created_at, updated_at)
    VALUES (?, ?, ?, 'running', ?, ?, '', ?, ?)
  `).run(input.id, input.userId, input.title, input.model, input.promptPreview, timestamp, timestamp);
}

export function updateRun(input: {
  id: string;
  status?: RunStatus;
  summary?: string;
  title?: string;
  promptPreview?: string;
}) {
  const existing = db.prepare('SELECT * FROM runs WHERE id = ?').get(input.id) as Record<string, string> | undefined;

  if (!existing) {
    return;
  }

  db.prepare(`
    UPDATE runs
    SET status = ?, summary = ?, title = ?, prompt_preview = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.status ?? existing.status,
    input.summary ?? existing.summary,
    input.title ?? existing.title,
    input.promptPreview ?? existing.prompt_preview,
    now(),
    input.id
  );
}

export function addMessage(message: StoredMessage) {
  db.prepare(`
    INSERT INTO messages (id, run_id, role, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(message.id, message.runId, message.role, message.content, message.createdAt);
}

export function addAttachment(attachment: StoredAttachment) {
  db.prepare(`
    INSERT INTO attachments (id, run_id, message_id, name, mime_type, size_bytes, stored_path, size_label, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attachment.id,
    attachment.runId,
    attachment.messageId,
    attachment.name,
    attachment.mimeType,
    attachment.sizeBytes,
    attachment.storedPath,
    attachment.sizeLabel,
    attachment.createdAt
  );
}

export function addActionRequest(action: StoredActionRequest) {
  db.prepare(`
    INSERT INTO action_requests (
      id, run_id, message_id, kind, title, summary, target, payload_json, status, requested_at, updated_at, result_summary, error_message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action.id,
    action.runId,
    action.messageId,
    action.kind,
    action.title,
    action.summary,
    action.target,
    action.payloadJson,
    action.status,
    action.requestedAt,
    action.updatedAt,
    action.resultSummary,
    action.errorMessage
  );
}

export function updateActionRequest(input: {
  id: string;
  status: ActionStatus;
  resultSummary?: string | null;
  errorMessage?: string | null;
}) {
  db.prepare(`
    UPDATE action_requests
    SET status = ?, result_summary = ?, error_message = ?, updated_at = ?
    WHERE id = ?
  `).run(input.status, input.resultSummary ?? null, input.errorMessage ?? null, now(), input.id);
}

export function getRun(runId: string) {
  const row = db.prepare(`
    SELECT
      runs.id,
      runs.user_id as userId,
      runs.title,
      runs.status,
      runs.model,
      runs.prompt_preview as promptPreview,
      runs.summary,
      runs.created_at as createdAt,
      runs.updated_at as updatedAt,
      (
        SELECT COUNT(*)
        FROM attachments
        WHERE attachments.run_id = runs.id
      ) as attachmentCount
    FROM runs
    WHERE runs.id = ?
  `).get(runId) as StoredRun | undefined;

  return row ?? null;
}

export function listRuns(userId: string) {
  return db.prepare(`
    SELECT
      runs.id,
      runs.user_id as userId,
      runs.title,
      runs.status,
      runs.model,
      runs.prompt_preview as promptPreview,
      runs.summary,
      runs.created_at as createdAt,
      runs.updated_at as updatedAt,
      (
        SELECT COUNT(*)
        FROM attachments
        WHERE attachments.run_id = runs.id
      ) as attachmentCount
    FROM runs
    WHERE runs.user_id = ?
    ORDER BY runs.updated_at DESC
  `).all(userId) as unknown as StoredRun[];
}

export function listMessages(runId: string) {
  return db.prepare(`
    SELECT id, run_id as runId, role, content, created_at as createdAt
    FROM messages
    WHERE run_id = ?
    ORDER BY created_at ASC
  `).all(runId) as unknown as StoredMessage[];
}

export function listAttachments(runId: string) {
  return db.prepare(`
    SELECT
      id,
      run_id as runId,
      message_id as messageId,
      name,
      mime_type as mimeType,
      size_bytes as sizeBytes,
      stored_path as storedPath,
      size_label as sizeLabel,
      created_at as createdAt
    FROM attachments
    WHERE run_id = ?
    ORDER BY created_at ASC
  `).all(runId) as unknown as StoredAttachment[];
}

export function listActionRequests(runId: string) {
  return db.prepare(`
    SELECT
      id,
      run_id as runId,
      message_id as messageId,
      kind,
      title,
      summary,
      target,
      payload_json as payloadJson,
      status,
      requested_at as requestedAt,
      updated_at as updatedAt,
      result_summary as resultSummary,
      error_message as errorMessage
    FROM action_requests
    WHERE run_id = ?
    ORDER BY requested_at DESC
  `).all(runId) as unknown as StoredActionRequest[];
}

export function getActionRequest(id: string) {
  const row = db.prepare(`
    SELECT
      id,
      run_id as runId,
      message_id as messageId,
      kind,
      title,
      summary,
      target,
      payload_json as payloadJson,
      status,
      requested_at as requestedAt,
      updated_at as updatedAt,
      result_summary as resultSummary,
      error_message as errorMessage
    FROM action_requests
    WHERE id = ?
  `).get(id) as StoredActionRequest | undefined;

  return row ?? null;
}

export function getSessionLink(runId: string) {
  const row = db.prepare(`
    SELECT
      run_id as runId,
      readonly_session_key as readonlySessionKey,
      operator_session_key as operatorSessionKey,
      readonly_response_id as readonlyResponseId,
      operator_response_id as operatorResponseId,
      updated_at as updatedAt
    FROM session_links
    WHERE run_id = ?
  `).get(runId) as SessionLink | undefined;

  return row ?? null;
}

export function upsertSessionLink(link: SessionLink) {
  db.prepare(`
    INSERT INTO session_links (
      run_id,
      readonly_session_key,
      operator_session_key,
      readonly_response_id,
      operator_response_id,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(run_id) DO UPDATE SET
      readonly_session_key = excluded.readonly_session_key,
      operator_session_key = excluded.operator_session_key,
      readonly_response_id = excluded.readonly_response_id,
      operator_response_id = excluded.operator_response_id,
      updated_at = excluded.updated_at
  `).run(
    link.runId,
    link.readonlySessionKey,
    link.operatorSessionKey,
    link.readonlyResponseId,
    link.operatorResponseId,
    link.updatedAt
  );
}

export function closeDatabase() {
  db.close();
}
