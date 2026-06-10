import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './admin.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminService } from './admin.service';
import { AdminCoursesService } from './admin-courses.service';
import { KhoaHoc } from '../courses/entities/course.entity';
import { ThongBao } from './entities/notification.entity';
import { CourseModerationHistory } from './entities/course-moderation-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KhoaHoc, ThongBao, CourseModerationHistory]),
  ],
  controllers: [AdminDashboardController, AdminCoursesController],
  providers: [AdminService, AdminCoursesService],
})
export class AdminDashboardModule {}
