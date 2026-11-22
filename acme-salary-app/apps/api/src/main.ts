import 'reflect-metadata';
import { createApp } from './app.js';
import { APP_CONFIG, type AppConfig } from './config/config.module.js';
async function bootstrap() {
  const app = await createApp();
  try {
    const config = app.get<AppConfig>(APP_CONFIG);
    await app.listen(config.PORT, '127.0.0.1');
    process.stdout.write(JSON.stringify({ event: 'started', port: config.PORT }) + '\n');
  } catch (error) {
    await app.close();
    throw error;
  }
}
bootstrap().catch((error: unknown) => {
  process.stderr.write(
    JSON.stringify({
      event: 'startup_failed',
      message:
        error instanceof Error && error.message.startsWith('Invalid configuration:')
          ? error.message
          : 'Application could not start',
    }) + '\n',
  );
  process.exitCode = 1;
});
