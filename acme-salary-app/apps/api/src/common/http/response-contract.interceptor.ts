import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs';
import type { ZodType } from 'zod';
import { RESPONSE_SCHEMA } from './response-contract.js';

/** The same feature schema documents and validates the public projection; values never enter diagnostics. */
@Injectable()
export class ResponseContractInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler<unknown>) {
    const schema = this.reflector.get<ZodType | undefined>(RESPONSE_SCHEMA, context.getHandler());
    if (!schema) return next.handle();
    return next.handle().pipe(map(value => {
      const result = schema.safeParse(value);
      if (!result.success) {
        process.stderr.write('{"event":"response_contract_failed"}\n');
        throw new InternalServerErrorException('Response contract failed');
      }
      return result.data;
    }));
  }
}
