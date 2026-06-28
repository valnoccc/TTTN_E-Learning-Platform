import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './admin.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';
import { AdminCoursesService } from './admin-courses.service';
import { AdminUsersService } from './admin-users.service';
import { KhoaHoc } from '../courses/entities/course.entity';
import { CourseModerationHistory } from './entities/course-moderation-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KhoaHoc, CourseModerationHistory, User]),
    NotificationsModule,
  ],
  controllers: [AdminDashboardController, AdminCoursesController, AdminUsersController],
  providers: [AdminService, AdminCoursesService, AdminUsersService],
})
export class AdminDashboardModule {}
