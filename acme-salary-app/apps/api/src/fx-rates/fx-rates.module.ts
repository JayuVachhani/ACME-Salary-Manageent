import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule, APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthenticationService } from '../auth/authentication.service.js';
import { FxRatesController } from './fx-rates.controller.js';
import { FxRatesService } from './fx-rates.service.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule], controllers: [FxRatesController], providers: [
    {
      provide: FxRatesService, inject: [Pool, AuthenticationService, APP_CONFIG],
      useFactory: (pool: Pool, auth: AuthenticationService, config: AppConfig) => new FxRatesService(pool, auth, config.FX_MAX_STALENESS_DAYS)
    },
  ]
})
export class FxRatesModule {
}
