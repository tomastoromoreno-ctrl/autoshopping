import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  const config = app.get(ConfigService);

  const sentryDsn = config.get('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: config.get('NODE_ENV', 'production'),
      tracesSampleRate: 0.1,
    });
    console.log('Sentry initialized');
  }

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.use((req: any, res: any, next: any) => {
    res.on('finish', () => {
      if (res.statusCode >= 500) {
        Sentry.captureException(new Error(`HTTP ${res.statusCode} ${req.method} ${req.url}`));
      }
    });
    next();
  });

  const port = config.get('PORT', 3001);
  await app.listen(port);
  console.log(`AutoShopping API running on port ${port}`);
}
bootstrap();
