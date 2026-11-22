import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
/** Build the real module graph without listening, for runtime wiring tests. */
export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  app.use(helmet());
  app.use('/api/v1', (_req: Request, res: Response, next: NextFunction) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const started = performance.now();
    res.on('finish', () => {
      // Allowlist metadata: never log bodies, query strings, cookies or headers.
      process.stdout.write(JSON.stringify({
        event: 'http_request', requestId,
        method: req.method, status: res.statusCode, durationMs: Math.round(performance.now() - started)
      }) + '\n');
    });
    next();
  });
  app.enableShutdownHooks();
  return app;
}
