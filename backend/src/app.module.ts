import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { appConfig } from './config/app.config';
import {
  buildTypeOrmOptions,
  databaseConfig,
  DatabaseConfig,
} from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { InstructorsModule } from './modules/instructors/instructors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = configService.get<DatabaseConfig>('database');
        if (!database) {
          throw new Error('Database configuration is missing');
        }

        return buildTypeOrmOptions(database, {
          entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
        });
      },
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    InstructorsModule,
  ],
})
export class AppModule {}
