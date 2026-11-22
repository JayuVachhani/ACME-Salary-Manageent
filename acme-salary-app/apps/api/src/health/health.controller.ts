import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiErrors, ApiResult } from '../common/http/api-contract.decorators.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@ApiErrors(500)
@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get('/healthz')
  @ApiResult(z.object({ status: z.literal('ok') }))
  live() {
    return { status: 'ok' };
  }

  @Get('/readyz')
  @ApiResult(
    z.object({
      status: z.literal('not_ready'),
      reason: z.enum(['schema_not_verified', 'database_unavailable']),
    }),
    503,
    'Readiness intentionally fails until schema readiness is implemented',
  )
  ready() {
    return this.health.ready();
  }
}
