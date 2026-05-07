import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from './env.ts';

export const AUTH_COOKIE_NAME = 'nba_demo_session';

const payloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.literal('admin'),
  name: z.string()
});

export type AuthUser = z.infer<typeof payloadSchema>;

export function verifyAuthToken(token: string) {
  return payloadSchema.parse(jwt.verify(token, env.jwtSecret));
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    response.status(401).json({ message: 'Unauthenticated' });
    return;
  }

  try {
    const user = verifyAuthToken(token);
    (request as AuthenticatedRequest).user = user;
    next();
  } catch {
    response.status(401).json({ message: 'Unauthenticated' });
  }
}
