import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule, APP_CONFIG, type AppConfig } from '../config/config.module.js';
@Module({
  imports: [ConfigModule],
  providers: [{
    provide: Pool, inject: [APP_CONFIG], useFactory: (config: AppConfig) => new Pool({
      connectionString: config.DATABASE_URL, max: 10, connectionTimeoutMillis: 3000,
      statement_timeout: 5000, idle_in_transaction_session_timeout: 10000,
    })
  }],
  exports: [Pool],
})
export class DatabaseModule {
}
