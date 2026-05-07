import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { env } from './env.ts';

export interface PlatformUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
}

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

export const db = new DatabaseSync(env.dbPath);
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export function ensureAdminUser() {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(env.adminEmail) as { id: string } | undefined;
  const passwordHash = bcrypt.hashSync(env.adminPassword, 10);

  if (existing) {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, name = ?, role = 'admin', updated_at = ?
      WHERE id = ?
    `).run(passwordHash, env.adminName, now, existing.id);
    return existing.id;
  }

  const id = 'demo-admin';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'admin', ?, ?)
  `).run(id, env.adminEmail, passwordHash, env.adminName, now, now);
  return id;
}

export function findUserByEmail(email: string): PlatformUser | null {
  const row = db.prepare(`
    SELECT
      id,
      email,
      password_hash as passwordHash,
      name,
      role,
      created_at as createdAt,
      updated_at as updatedAt
    FROM users
    WHERE email = ?
  `).get(email) as PlatformUser | undefined;

  return row ?? null;
}

export function findUserById(id: string): PlatformUser | null {
  const row = db.prepare(`
    SELECT
      id,
      email,
      password_hash as passwordHash,
      name,
      role,
      created_at as createdAt,
      updated_at as updatedAt
    FROM users
    WHERE id = ?
  `).get(id) as PlatformUser | undefined;

  return row ?? null;
}
