import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { KhoaHoc } from './entities/course.entity';
import { CoursesController } from './controllers/course-instructor.controller';
import { CoursesService } from './services/course-instructor.service';

@Module({
  imports: [TypeOrmModule.forFeature([KhoaHoc]), CloudinaryModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
