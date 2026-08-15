import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Global Validation Pipe ──────────────────────────────────────────────────
  // Bắt buộc để class-validator (@IsNoProfanity, @IsString, v.v.) hoạt động.
  // whitelist: tự động loại bỏ các field không khai báo trong DTO.
  // forbidNonWhitelisted: trả 400 nếu client gửi field không hợp lệ.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );


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
}
bootstrap();