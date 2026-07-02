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
import { CategoriesModule } from './modules/categories/categories.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { AdminDashboardModule } from './modules/admin/admin-dashboard.module';
import { InstructorDashboardModule } from './modules/instructor-dashboard/instructor-dashboard.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { ForumModule } from './modules/forum/forum.module';
import { LearningToolsModule } from './modules/learning-tools/learning-tools.module';

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
    ReviewsModule,
    DiscussionsModule,
    CouponsModule,
    CoursesModule,
    LessonsModule,
    InstructorsModule,
    CategoriesModule,
    CloudinaryModule,
    AdminDashboardModule,
    InstructorDashboardModule,
    CheckoutModule,
    NotificationsModule,
    PostsModule,
    ForumModule,
    LearningToolsModule,
  ],
})
export class AppModule {}
