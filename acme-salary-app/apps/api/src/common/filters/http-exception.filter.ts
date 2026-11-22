import { Catch, HttpException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationError } from '../errors/application-error.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;
    const readiness = error instanceof ApplicationError && error.status === 503 && error.details?.status === 'not_ready'
      && ['schema_not_verified', 'database_unavailable'].includes(error.details.reason ?? '');
    if (error instanceof ApplicationError && (error.status < 500 || readiness)) {
      // Readiness has an intentional 503 status/reason contract; preserve approved application errors.
      response.status(error.status).json(error.details ?? { statusCode: error.status, message: error.message });
      return;
    }
    if (error instanceof HttpException && error.getStatus() < 500) {
      const status = error.getStatus();
      const body = error.getResponse();
      response.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }
    const status = error instanceof ApplicationError ? error.status : error instanceof HttpException ? error.getStatus() : 500;
    process.stderr.write(JSON.stringify({ event: 'http_failure', requestId: response.getHeader('X-Request-Id'), status }) + '\n');
    response.status(status).json({ statusCode: status, message: 'Internal server error' });
  }
}
