import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { logDatabaseFailure } from './database-errors.js';
import { ConfigModule, APP_CONFIG, type AppConfig } from '../config/config.module.js';
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Pool,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const pool = new Pool({
          connectionString: config.DATABASE_URL,
          max: 10,
          connectionTimeoutMillis: 3000,
          statement_timeout: 5000,
          idle_in_transaction_session_timeout: 10000,
        });
        pool.on('error', (error) => logDatabaseFailure('database_background_error', error));
        return pool;
      },
    },
  ],
  exports: [Pool],
})
export class DatabaseModule {}
