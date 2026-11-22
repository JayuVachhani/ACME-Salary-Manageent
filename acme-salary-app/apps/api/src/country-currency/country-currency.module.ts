import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthenticationService } from '../auth/authentication.service.js';
import { CountryCurrencyController } from './country-currency.controller.js';
import { CountryCurrencyService } from './country-currency.service.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule], controllers: [CountryCurrencyController], providers: [
    {
      provide: CountryCurrencyService, inject: [Pool, AuthenticationService],
      useFactory: (pool: Pool, auth: AuthenticationService) => new CountryCurrencyService(pool, auth)
    },
  ]
})
export class CountryCurrencyModule {
}
