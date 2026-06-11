import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CoursesController } from './controllers/course-instructor.controller';
import { PublicCoursesController } from './controllers/public-courses.controller';
import { KhoaHoc } from './entities/course.entity';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';
import { CourseInstructorDiscussionsService } from './services/course-instructor-discussions.service';
import { CoursesService } from './services/course-instructor.service';

@Module({
  imports: [TypeOrmModule.forFeature([KhoaHoc]), CloudinaryModule],
  controllers: [CoursesController, PublicCoursesController],
  providers: [
    CoursesService,
    CourseInstructorDiscussionsService,
    CourseInstructorCurriculumService,
  ],
})
export class CoursesModule {}
