import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { OtpDeliveries } from './mail/otp-deliveries.service.js';

/** HTTP disposal precedes this hook; mail invalidation must finish before pool closure. */
@Injectable()
export class ApplicationLifecycle implements OnApplicationShutdown {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(OtpDeliveries) private readonly deliveries: OtpDeliveries,
  ) {}
  async onApplicationShutdown() {
    await this.deliveries.drain();
    await this.pool.end();
  }
}
