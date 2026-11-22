import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const pathname = req.originalUrl.split('?', 1)[0];
    if (pathname === '/api/v1' || pathname?.startsWith('/api/v1/')) res.setHeader('Cache-Control', 'no-store');
    const started = performance.now();
    res.once('finish', () => {
      // Allowlist only: no bodies, URLs, cookies, SQL, exception messages or employee data.
      process.stdout.write(JSON.stringify({ event: 'http_request', requestId, method: req.method,
        status: res.statusCode, durationMs: Math.round(performance.now() - started) }) + '\n');
    });
    next();
  }
}
