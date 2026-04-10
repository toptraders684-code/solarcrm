import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 1 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: { error: { code: 429, message: 'Too many requests' } },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/api/v1/health'],
  });

  // Health check (no auth, no prefix needed)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Suryam CRM backend running on http://0.0.0.0:${port}`);
}
bootstrap();
