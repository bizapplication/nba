import type { NextFunction, Request, Response } from 'express';

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  res.status(500).json({ message: error.message || 'Internal Server Error' });
}
