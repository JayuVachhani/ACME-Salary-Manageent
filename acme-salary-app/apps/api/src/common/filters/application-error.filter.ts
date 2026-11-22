import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationError } from '../errors/application-error.js';
@Catch(ApplicationError)
export class ApplicationErrorFilter implements ExceptionFilter {
  catch(error: ApplicationError, host: ArgumentsHost) {
    // Preserve Nest's existing response body and status contract.
    const response = host.switchToHttp().getResponse<Response>();
    response.status(error.status).json(error.details ?? { statusCode: error.status, message: error.message });
  }
}
