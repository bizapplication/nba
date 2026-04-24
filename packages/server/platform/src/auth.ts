import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from './env.ts';

export const AUTH_COOKIE_NAME = 'nba_demo_session';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: 'admin';
  name: string;
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: '7d'
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}

export function setAuthCookie(response: Response, token: string) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/'
  });
}
