import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './config/config.module.js';
import { configureOpenApi } from './common/http/openapi.js';

/** Composition and HTTP setup only; feature behavior lives in injected providers. */
export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  try {
    const config = app.get<AppConfig>(APP_CONFIG);
    app.use(helmet());
    app.enableCors({
      origin: config.APP_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      exposedHeaders: ['X-Request-Id'],
    });
    // API documentation is local/test only; production exposes no documentation routes.
    if (config.NODE_ENV !== 'production') configureOpenApi(app);
    app.enableShutdownHooks();
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
