import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';
import { loadConfig } from './config.js';

async function bootstrap() {
  const config = loadConfig(process.env);
  const pool = new Pool({ connectionString: config.DATABASE_URL, max: 10,
    connectionTimeoutMillis: 3000, statement_timeout: 5000, idle_in_transaction_session_timeout: 10000 });
  // Health checks expose no connection details, schema names or credentials.
  @Controller()
  class HealthController {
    @Get('/healthz') live() { return { status: 'ok' }; }
    @Get('/readyz') async ready() {
      try {
        // A live database is not sufficient: no domain migrations are accepted yet.
        await pool.query('SELECT 1');
        throw new ServiceUnavailableException({ status: 'not_ready', reason: 'schema_not_verified' });
      } catch (error) {
        if (error instanceof ServiceUnavailableException) throw error;
        throw new ServiceUnavailableException({ status: 'not_ready', reason: 'database_unavailable' });
      }
    }
  }
  @Module({ controllers: [HealthController] })
  class AppModule {}
  const app = await NestFactory.create(AppModule, { logger: false });
  app.use(helmet());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const started = performance.now();
    res.on('finish', () => {
      // Allowlist metadata: never log bodies, query strings, cookies or headers.
      process.stdout.write(JSON.stringify({ event: 'http_request', requestId,
        method: req.method, status: res.statusCode, durationMs: Math.round(performance.now() - started) }) + '\n');
    });
    next();
  });
  app.enableShutdownHooks();
  const close = app.close.bind(app);
  app.close = async () => { await close(); await pool.end(); };
  await app.listen(config.PORT, '127.0.0.1');
  process.stdout.write(JSON.stringify({ event: 'started', port: config.PORT }) + '\n');
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(JSON.stringify({ event: 'startup_failed', message:
    error instanceof Error && error.message.startsWith('Invalid configuration:') ? error.message : 'Application could not start' }) + '\n');
  process.exitCode = 1;
});
