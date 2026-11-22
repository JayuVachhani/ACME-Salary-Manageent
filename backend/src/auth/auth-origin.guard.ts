import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RequestSecurity } from '../common/http/request-security.service.js';
@Injectable()
export class AuthOriginGuard implements CanActivate {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'POST') this.security.origin(request, 'Request origin rejected');
    return true;
  }
}
