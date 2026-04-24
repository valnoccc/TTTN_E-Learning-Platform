import {
  Controller, Get, Post, Put, Body, Param, UseGuards, Request,
  InternalServerErrorException, UseInterceptors, UploadedFile, Patch, Delete
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @Get('my-courses')
  async getMyCourses(@Request() req) {
    const instructorId = req.user.sub;
    const courses = await this.coursesService.getCoursesByInstructor(instructorId);
    return { message: 'Lấy danh sách khóa học thành công', data: courses };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string, @Request() req) {
    const course = await this.coursesService.getCourseById(Number(id), req.user.sub);
    return { message: 'Lấy thông tin khóa học thành công', data: course };
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', '..', 'frontend', 'public', 'images'),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async createCourse(@Request() req, @Body() courseData: any, @UploadedFile() file: Express.Multer.File) {
    try {
      const payloadToSave = {
        ...courseData,
        id_giang_vien: req.user.sub,
        hinh_anh: file ? `/images/${file.filename}` : null
      };
      // Lưu ý: @Body nhận dữ liệu từ FormData luôn là String, cần ép kiểu nếu cần trong Service
      const newCourse = await this.coursesService.createCourse(payloadToSave);
      return { message: 'Tạo khóa học thành công', data: newCourse };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi tạo khóa học');
    }
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', '..', 'frontend', 'public', 'images'),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async updateCourse(
    @Param('id') courseId: string,
    @Request() req,
    @Body() courseData: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const payload = { ...courseData };
      if (file) {
        payload.hinh_anh = `/images/${file.filename}`;
      }
      const updatedCourse = await this.coursesService.updateCourse(Number(courseId), req.user.sub, payload);
      return { message: 'Cập nhật khóa học thành công', data: updatedCourse };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi cập nhật khóa học');
    }
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req, @Body() statusData: any) {
    const updatedCourse = await this.coursesService.updateCourseStatus(Number(id), req.user.sub, statusData.trang_thai);
    return { message: 'Cập nhật trạng thái thành công', data: updatedCourse };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(Number(id), req.user.sub);
  }
}