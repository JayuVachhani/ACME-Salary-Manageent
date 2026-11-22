import { Module } from '@nestjs/common';
import { loadConfig } from './config.js';
export type AppConfig = ReturnType<typeof loadConfig>;
export const APP_CONFIG = Symbol('APP_CONFIG');
@Module({ providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig(process.env) }], exports: [APP_CONFIG] })
export class ConfigModule {
}
