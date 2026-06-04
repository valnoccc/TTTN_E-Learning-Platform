import {
  Controller, Get, Post, Put, Body, Param, UseGuards, Request,
  InternalServerErrorException, UseInterceptors, UploadedFile, Patch, Delete
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { serializeCourse } from './course-response.util';
import { CloudinaryService } from '../cloudinary/cloudinary.service';



@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor
    (
      private readonly coursesService: CoursesService,
      private readonly cloudinaryService: CloudinaryService
    ) { }

  @Get('my-courses')
  async getMyCourses(@Request() req) {
    const instructorId = req.user.sub;
    const courses = await this.coursesService.getCoursesByInstructor(instructorId);
    return { message: 'Lấy danh sách khóa học thành công', data: courses.map(serializeCourse) };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string, @Request() req) {
    const course = await this.coursesService.getCourseById(Number(id), req.user.sub);
    return { message: 'Lấy thông tin khóa học thành công', data: serializeCourse(course) };
  }

  @Post()
  @UseInterceptors(FileInterceptor('image')) // Bỏ cấu hình diskStorage ở đây
  async createCourse(@Request() req, @Body() courseData: any, @UploadedFile() file: Express.Multer.File) {
    let imageUrl = null;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file, 'image');
      imageUrl = uploadResult.secure_url;
    }

    const payload = {
      maDM: Number(courseData.maDM ?? 0),
      maND_GiangVien: req.user.sub,
      tenKhoaHoc: courseData.tenKhoaHoc,
      moTa: courseData.moTa,
      giaBan: Number(courseData.giaBan ?? 0),
      trangThai: courseData.trangThai ?? 'DRAFT',
      hinhThuNho: imageUrl // Dùng trường này
    };

    const newCourse = await this.coursesService.createCourse(payload);
    return { message: 'Tạo khóa học thành công', data: serializeCourse(newCourse) };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image')) // Bỏ cấu hình diskStorage ở đây
  async updateCourse(
    @Param('id') courseId: string,
    @Request() req,
    @Body() courseData: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    let imageUrl = courseData.hinhThuNho; // Giữ URL cũ nếu không upload ảnh mới

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file, 'image');
      imageUrl = uploadResult.secure_url;
    }

    const payload: any = {
      maDM: Number(courseData.maDM ?? courseData.id_danh_muc ?? 0),
      tenKhoaHoc: courseData.tenKhoaHoc ?? courseData.ten_khoa_hoc,
      moTa: courseData.moTa ?? courseData.mo_ta,
      giaBan: Number(courseData.giaBan ?? courseData.gia ?? 0),
      trangThai: courseData.trangThai ?? courseData.trang_thai,
      hinhThuNho: imageUrl // Cập nhật URL mới
    };

    const updatedCourse = await this.coursesService.updateCourse(Number(courseId), req.user.sub, payload);
    return { message: 'Cập nhật khóa học thành công', data: serializeCourse(updatedCourse) };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req, @Body() statusData: any) {
    const updatedCourse = await this.coursesService.updateCourseStatus(
      Number(id),
      req.user.sub,
      statusData.trangThai ?? statusData.trang_thai,
    );
    return { message: 'Cập nhật trạng thái thành công', data: updatedCourse };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(Number(id), req.user.sub);
  }


}
