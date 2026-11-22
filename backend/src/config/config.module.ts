import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { loadConfig } from './config.js';
export type AppConfig = ReturnType<typeof loadConfig>;
export const AUTH_KEY = Symbol('AUTH_KEY');
export const AUTH_LIMITS = Symbol('AUTH_LIMITS');
export const CLOCK = Symbol('CLOCK');
export const FX_STALE_DAYS = Symbol('FX_STALE_DAYS');
export const APP_CONFIG = Symbol('APP_CONFIG');
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: false,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
      validate: loadConfig,
      load: [() => ({ application: loadConfig(process.env) })],
    }),
  ],
  providers: [
    { provide: CLOCK, useValue: () => new Date() },
    {
      provide: AUTH_KEY,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => config.OTP_HMAC_SECRET,
    },
    {
      provide: AUTH_LIMITS,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        otpMinutes: config.OTP_TTL_MINUTES,
        idleMinutes: config.SESSION_IDLE_MINUTES,
        absoluteHours: config.SESSION_ABSOLUTE_HOURS,
      }),
    },
    {
      provide: FX_STALE_DAYS,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => config.FX_MAX_STALENESS_DAYS,
    },
    {
      provide: APP_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow<AppConfig>('application'),
    },
  ],
  exports: [APP_CONFIG, FX_STALE_DAYS, AUTH_KEY, AUTH_LIMITS, CLOCK],
})
export class ConfigModule {}
