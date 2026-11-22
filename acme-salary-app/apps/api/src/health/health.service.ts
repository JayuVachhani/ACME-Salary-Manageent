import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ApplicationError } from '../common/errors/application-error.js';
@Injectable()
export class HealthService {
  constructor(
  @Inject(Pool) private readonly pool: Pool) { }
  async ready() {
    try {
      await this.pool.query('SELECT 1');
      throw new ApplicationError('Schema not verified', 503, { status: 'not_ready', reason: 'schema_not_verified' });
    }
    catch (error) {
      if (error instanceof ApplicationError)
        throw error;
      throw new ApplicationError('Database unavailable', 503, { status: 'not_ready', reason: 'database_unavailable' });
    }
  }
}
