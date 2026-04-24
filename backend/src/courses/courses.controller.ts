import { Controller, Patch, Delete, Get, Post, Put, Body, Param, UseGuards, Request, InternalServerErrorException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @Get('my-courses')
  async getMyCourses(@Request() req) {
    try {
      const instructorId = req.user.sub;
      if (!instructorId) throw new InternalServerErrorException('Instructor ID not found');

      const courses = await this.coursesService.getCoursesByInstructor(instructorId);
      return { message: 'Lấy danh sách khóa học thành công', data: courses };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to fetch courses: ' + (error?.message || 'Unknown error'));
    }
  }

  // API: LẤY CHI TIẾT 1 KHÓA HỌC ĐỂ ĐƯA LÊN FORM FRONTEND
  // ---------------------------------------------------------
  @Get(':id')
  async getCourseById(@Param('id') id: string, @Request() req) {
    try {
      const course = await this.coursesService.getCourseById(Number(id), req.user.sub);
      return {
        message: 'Lấy thông tin khóa học thành công',
        data: course
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Lỗi khi lấy chi tiết khóa học');
    }
  }

  @Post()
  async createCourse(@Request() req, @Body() courseData: any) {
    try {
      const payloadToSave = { ...courseData, id_giang_vien: req.user.sub };
      const newCourse = await this.coursesService.createCourse(payloadToSave);
      return { message: 'Tạo khóa học thành công', data: newCourse };
    } catch (error: any) {
      throw new InternalServerErrorException('Lỗi khi lưu vào Database');
    }
  }

  @Put(':id')
  async updateCourse(@Param('id') courseId: string, @Request() req, @Body() courseData: any) {
    try {
      const updatedCourse = await this.coursesService.updateCourse(Number(courseId), req.user.sub, courseData);
      return { message: 'Cập nhật khóa học thành công', data: updatedCourse };
    } catch (error: any) {
      throw new InternalServerErrorException('Lỗi khi cập nhật Database');
    }
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req, @Body() statusData: any) {
    const updatedCourse = await this.coursesService.updateCourseStatus(Number(id), req.user.sub, statusData.trang_thai);
    return { message: 'Cập nhật trạng thái khóa học thành công', data: updatedCourse };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // Đã đồng bộ sử dụng req.user.sub giống các hàm trên
    return this.coursesService.remove(Number(id), req.user.sub);
  }
}