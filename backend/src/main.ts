import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cho phép truy cập folder public từ backend
  app.useStaticAssets(join(__dirname, '..', 'public'));
  // Cho phép truy cập folder images từ frontend/public
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'public'), { prefix: '/' });

  app.enableCors();
  await app.listen(3000);
}
bootstrap();