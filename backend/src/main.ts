import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cho phép truy cập folder public từ backend
  app.useStaticAssets(join(__dirname, '..', 'public'));
  // Cho phép truy cập folder images từ frontend/public
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'public'), {
    prefix: '/',
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;

  await app.listen(port);

  // ---> THÊM ĐOẠN NÀY VÀO CUỐI HÀM <---
  console.log(`\n======================================================`);
  console.log(`Backend running at: http://localhost:${port}`);
  console.log(`======================================================\n`);
}
bootstrap();
