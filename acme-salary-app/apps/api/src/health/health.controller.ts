import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
@Controller()
export class HealthController {
  constructor(
    @Inject(Pool) private readonly pool: Pool) { }
  @Get('/healthz')
  live() { return { status: 'ok' }; }
  @Get('/readyz')
  async ready() {
    try {
      await this.pool.query('SELECT 1');
      // Preserve the existing fail-closed contract until schema readiness is designed.
      throw new ServiceUnavailableException({ status: 'not_ready', reason: 'schema_not_verified' });
    }
    catch (error) {
      if (error instanceof ServiceUnavailableException)
        throw error;
      throw new ServiceUnavailableException({ status: 'not_ready', reason: 'database_unavailable' });
    }
  }
}
