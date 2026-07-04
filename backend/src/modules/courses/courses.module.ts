import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { LessonVideoStorageModule } from '../lesson-video-storage/lesson-video-storage.module';
import { CoursesController } from './controllers/course-instructor.controller';
import { CourseAdminController } from './controllers/course-admin.controller';
import { PublicCoursesController } from './controllers/public-courses.controller';
import { KhoaHoc } from './entities/course.entity';
import { CourseModerationHistory } from './entities/course-moderation-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';
import { CoursesService } from './services/course-instructor.service';
import { CourseAdminService } from './services/course-admin.service';
import { CourseStudentService } from './services/course-student.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KhoaHoc, CourseModerationHistory]),
    CloudinaryModule,
    LessonVideoStorageModule,
    NotificationsModule,
  ],
  controllers: [
    CoursesController,
    CourseAdminController,
    PublicCoursesController,
  ],
  providers: [
    CoursesService,
    CourseInstructorCurriculumService,
    CourseAdminService,
    CourseStudentService,
  ],
})
export class CoursesModule {}
