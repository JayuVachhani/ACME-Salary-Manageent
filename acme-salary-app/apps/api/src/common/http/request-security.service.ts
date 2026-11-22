import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { APP_CONFIG, type AppConfig } from '../../config/config.module.js';
@Injectable()
export class RequestSecurity {
  constructor(
  @Inject(APP_CONFIG) private readonly config: AppConfig) { }
  cookie(req: Request, name: string): string {
    return req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1) ?? '';
  }
  token(req: Request): string { return this.cookie(req, 'acme_session'); }
  origin(req: Request, message = 'Request rejected'): void {
    if (req.headers.origin !== this.config.APP_ORIGIN)
      throw new ForbiddenException({ statusCode: 403, message });
  }
  csrf(req: Request): string {
    this.origin(req);
    const value = req.header('X-CSRF-Token');
    if (!value)
      throw new ForbiddenException({ statusCode: 403, message: 'Request rejected' });
    return value;
  }
}
