import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service.js';
@Controller()
export class HealthController {
  constructor(
  @Inject(HealthService) private readonly health: HealthService) { }
  @Get('/healthz')
  live() { return { status: 'ok' }; }
  @Get('/readyz')
  ready() { return this.health.ready(); }
}
