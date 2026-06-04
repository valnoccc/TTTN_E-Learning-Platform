import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { KhoaHoc } from './entities/course.entity'; // Đảm bảo đúng tên file entity
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // Import module Cloudinary nếu có
@Module({
  // Import TypeOrmModule.forFeature để Service có thể dùng được @InjectRepository
  imports: [TypeOrmModule.forFeature([KhoaHoc]), CloudinaryModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule { }