import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Đọc file .env
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      // Tự động quét tất cả các file entity trong project
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Giữ false để tránh NestJS tự ý sửa cấu trúc DB hiện tại của bạn

      // --- PHẦN SỬA ĐỔI NẰM Ở ĐÂY ---
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      // ------------------------------
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    CloudinaryModule,
  ],
})
export class AppModule { }