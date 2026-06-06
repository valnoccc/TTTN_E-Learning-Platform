import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CoursesController } from './controllers/course-instructor.controller';
import { KhoaHoc } from './entities/course.entity';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';
import { CourseInstructorDiscussionsService } from './services/course-instructor-discussions.service';
import { CourseInstructorReviewsService } from './services/course-instructor-reviews.service';
import { CoursesService } from './services/course-instructor.service';

@Module({
  imports: [TypeOrmModule.forFeature([KhoaHoc]), CloudinaryModule],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CourseInstructorReviewsService,
    CourseInstructorDiscussionsService,
    CourseInstructorCurriculumService,
  ],
})
export class CoursesModule {}
