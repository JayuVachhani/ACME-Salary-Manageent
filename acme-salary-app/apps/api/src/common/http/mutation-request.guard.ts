import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RequestSecurity } from './request-security.service.js';
/** Transport precondition only; session/permission authorization remains transactional. */
@Injectable()
export class MutationRequestGuard implements CanActivate {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (['POST', 'PATCH', 'DELETE'].includes(request.method)) this.security.csrf(request);
    return true;
  }
}
