import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule, APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { MailModule } from '../mail/mail.module.js';
import { AuthenticationService } from './authentication.service.js';
import { AuthController } from './auth.controller.js';
@Module({
  imports: [ConfigModule, DatabaseModule, MailModule], controllers: [AuthController], providers: [
    {
      provide: AuthenticationService, inject: [Pool, APP_CONFIG], useFactory: (pool: Pool, config: AppConfig) => new AuthenticationService(pool, config.OTP_HMAC_SECRET, () => new Date(), {
        otpMinutes: config.OTP_TTL_MINUTES, idleMinutes: config.SESSION_IDLE_MINUTES, absoluteHours: config.SESSION_ABSOLUTE_HOURS,
      })
    },
  ], exports: [AuthenticationService]
})
export class AuthModule {
}
