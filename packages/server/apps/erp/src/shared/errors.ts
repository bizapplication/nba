export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function badRequest(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): AppError {
  return new AppError(400, code, message, details);
}

export function notFound(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): AppError {
  return new AppError(404, code, message, details);
}

export function conflict(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): AppError {
  return new AppError(409, code, message, details);
}

export function notImplemented(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): AppError {
  return new AppError(501, code, message, details);
}
