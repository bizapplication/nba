import { badRequest } from './errors.ts';

export function asRecord(
  value: unknown,
  label = 'payload',
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('INVALID_PAYLOAD', `${label} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function readField(
  record: Record<string, unknown>,
  key: string,
): unknown {
  const value = record[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function requiredString(value: unknown, field: string): string {
  const normalized = normalizeString(value);
  if (!normalized) {
    throw badRequest('VALIDATION_ERROR', `${field} is required`, { field });
  }

  return normalized;
}

export function optionalString(value: unknown): string | null {
  return normalizeString(value);
}

export function requiredEnum<const T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  field: string,
): T[number] {
  const normalized = requiredString(value, field);

  if (!allowedValues.includes(normalized)) {
    throw badRequest('VALIDATION_ERROR', `${field} is invalid`, {
      field,
      allowedValues,
    });
  }

  return normalized as T[number];
}

export function optionalEnum<const T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  field: string,
): T[number] | null {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  if (!allowedValues.includes(normalized)) {
    throw badRequest('VALIDATION_ERROR', `${field} is invalid`, {
      field,
      allowedValues,
    });
  }

  return normalized as T[number];
}

export function optionalInteger(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(normalized) || normalized < 1) {
    throw badRequest('VALIDATION_ERROR', `${field} must be a positive integer`, {
      field,
    });
  }

  return Math.floor(normalized);
}

export function requiredPositiveNumber(value: unknown, field: string): number {
  const normalized =
    typeof value === 'number' ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw badRequest('VALIDATION_ERROR', `${field} must be a positive number`, {
      field,
    });
  }

  return normalized;
}

export function requiredCurrencyCode(value: unknown, field: string): string {
  const normalized = requiredString(value, field).toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw badRequest(
      'VALIDATION_ERROR',
      `${field} must be a 3-letter currency code`,
      { field },
    );
  }

  return normalized;
}

export function optionalCurrencyCode(value: unknown): string | null {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const upperCased = normalized.toUpperCase();
  if (!/^[A-Z]{3}$/.test(upperCased)) {
    throw badRequest(
      'VALIDATION_ERROR',
      'currencyCode must be a 3-letter currency code',
      { field: 'currencyCode' },
    );
  }

  return upperCased;
}

export function requiredDate(value: unknown, field: string): string {
  const normalized = requiredString(value, field);

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const time = Date.parse(normalized);
  if (Number.isNaN(time)) {
    throw badRequest('VALIDATION_ERROR', `${field} must be a valid date`, {
      field,
    });
  }

  return new Date(time).toISOString().slice(0, 10);
}

export function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw badRequest('VALIDATION_ERROR', `${field} must be a boolean`, {
    field,
  });
}
