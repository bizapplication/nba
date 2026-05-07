import { createApp } from './app';
import { AppDataSource, ensureDatabaseReady } from './infrastructure/persistence/typeorm/data-source';
import { env } from './shared/config/env';

async function bootstrap() {
  await ensureDatabaseReady();
  await AppDataSource.initialize();
  const app = createApp(AppDataSource);

  app.listen(env.port, env.host, () => {
    console.log(`CRM service listening on http://${env.host}:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start CRM service:', error);
  process.exit(1);
});
