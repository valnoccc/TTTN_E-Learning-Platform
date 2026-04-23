import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, InternalServerErrorException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('courses')
@UseGuards(JwtAuthGuard) // Bạn có thể đặt Guard ở đây để bảo vệ TẤT CẢ các API bên dưới
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  // 1. API: Lấy danh sách khóa học (Của bạn)
  @Get('my-courses')
  async getMyCourses(@Request() req) {
    try {
      const instructorId = req.user.sub;
      if (!instructorId) throw new InternalServerErrorException('Instructor ID not found');
      
      const courses = await this.coursesService.getCoursesByInstructor(instructorId);
      return { message: 'Lấy danh sách khóa học thành công', data: courses };
    } catch (error: any) {
      console.error('Error in getMyCourses:', error);
      throw new InternalServerErrorException('Failed to fetch courses: ' + (error?.message || 'Unknown error'));
    }
  }

  // ---------------------------------------------------------
  // 2. API: THÊM KHÓA HỌC MỚI (Đón lệnh POST từ React)
  // ---------------------------------------------------------
  @Post()
  async createCourse(@Request() req, @Body() courseData: any) {
    try {
      const instructorId = req.user.sub; // Lấy ID Giảng viên từ Token

      // Gắn thêm ID giảng viên vào gói dữ liệu trước khi gửi cho Service
      const payloadToSave = {
        ...courseData,
        id_giang_vien: instructorId,
      };

      console.log('Backend nhận được yêu cầu tạo khóa học:', payloadToSave);

      // Gọi sang Service để thực thi lệnh SQL INSERT INTO
      const newCourse = await this.coursesService.createCourse(payloadToSave);

      return {
        message: 'Tạo khóa học thành công',
        data: newCourse,
      };
    } catch (error: any) {
      console.error('Error creating course:', error);
      throw new InternalServerErrorException('Lỗi khi lưu vào Database');
    }
  }

  // ---------------------------------------------------------
  // 3. API: SỬA KHÓA HỌC (Đón lệnh PUT từ React)
  // ---------------------------------------------------------
  @Put(':id')
  async updateCourse(@Param('id') courseId: string, @Request() req, @Body() courseData: any) {
    try {
      const instructorId = req.user.sub;

      // Gọi sang Service để thực thi lệnh SQL UPDATE (Nhớ check xem khóa học này có đúng của giảng viên này không)
      const updatedCourse = await this.coursesService.updateCourse(Number(courseId), instructorId, courseData);

      return {
        message: 'Cập nhật khóa học thành công',
        data: updatedCourse,
      };
    } catch (error: any) {
      console.error('Error updating course:', error);
      throw new InternalServerErrorException('Lỗi khi cập nhật Database');
    }
  }
}