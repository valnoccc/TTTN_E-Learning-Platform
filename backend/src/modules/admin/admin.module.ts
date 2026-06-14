import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './admin.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminService } from './admin.service';
import { AdminCoursesService } from './admin-courses.service';
import { KhoaHoc } from '../courses/entities/course.entity';
import { CourseModerationHistory } from './entities/course-moderation-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KhoaHoc, CourseModerationHistory]),
    NotificationsModule,
  ],
  controllers: [AdminDashboardController, AdminCoursesController],
  providers: [AdminService, AdminCoursesService],
})
export class AdminDashboardModule {}
