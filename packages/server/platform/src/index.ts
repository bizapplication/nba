import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { AUTH_COOKIE_NAME, clearAuthCookie, setAuthCookie, signAuthToken, verifyAuthToken } from './auth.ts';
import { db, ensureAdminUser, findUserByEmail, findUserById } from './db.ts';
import { env } from './env.ts';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

ensureAdminUser();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'platform'
  });
});

app.post('/api/auth/login', async (request, response) => {
  const body = loginSchema.safeParse(request.body);

  if (!body.success) {
    response.status(400).json({
      message: 'Invalid login payload'
    });
    return;
  }

  const user = findUserByEmail(body.data.email);

  if (!user || !(await bcrypt.compare(body.data.password, user.passwordHash))) {
    response.status(401).json({
      message: 'Incorrect email or password'
    });
    return;
  }

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: 'admin',
    name: user.name
  });

  setAuthCookie(response, token);
  response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

app.post('/api/auth/logout', (_request, response) => {
  clearAuthCookie(response);
  response.json({ ok: true });
});

app.get('/api/auth/me', (request, response) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    response.status(401).json({ message: 'Unauthenticated' });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = findUserById(payload.sub);

    if (!user) {
      response.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch {
    response.status(401).json({ message: 'Unauthenticated' });
  }
});

app.use((_request, response) => {
  response.status(404).json({
    message: 'Route not found'
  });
});

const server = app.listen(env.port, env.host, () => {
  console.log(`Platform service listening on http://${env.host}:${env.port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down platform service...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
