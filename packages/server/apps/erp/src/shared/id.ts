import { randomUUID } from 'node:crypto';

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
}

export function nextSequenceCode(prefix: string, existingCodes: string[]): string {
  let max = 0;

  for (const code of existingCodes) {
    if (!code.startsWith(`${prefix}-`)) {
      continue;
    }

    const numericPart = code.slice(prefix.length + 1);
    const parsed = Number.parseInt(numericPart, 10);

    if (Number.isFinite(parsed) && parsed > max) {
      max = parsed;
    }
  }

  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}
