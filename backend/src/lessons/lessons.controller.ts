import {
  Controller, Post, Body, UseInterceptors, UploadedFile,
  UseGuards, Request, InternalServerErrorException, Get, Param,
  ParseIntPipe, NotFoundException,
  Query,
  Put,
  Delete,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonsService } from './lessons.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { serializeLesson } from './lesson-response.util';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('video')) // 'video' phải khớp với key trong FormData từ FE
  async create(
    @Request() req,
    @Body() lessonData: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      let videoUrl = null;

      // 1. Nếu có file gửi lên, tiến hành upload lên Cloudinary
      if (file) {
        const uploadResult = await this.cloudinaryService.uploadFile(file, 'video');
        videoUrl = uploadResult.secure_url;
      }

      // 2. Chuẩn bị dữ liệu để lưu vào Database
      const payload = {
        maKH: Number(lessonData.maKH ?? lessonData.id_khoa_hoc),
        tenBaiHoc: lessonData.tenBaiHoc ?? lessonData.tieu_de,
        noi_dung: lessonData.noi_dung || '',
        thuTu: Number(lessonData.thuTu ?? lessonData.thu_tu ?? 0),
        videoURL: videoUrl,
      };

      // 3. Gọi service để lưu bài học
      const newLesson = await this.lessonsService.create(payload);

      return {
        message: 'Thêm bài học thành công',
        data: serializeLesson(newLesson),
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Lỗi khi thêm bài học: ' + error.message);
    }
  }

  @Get()
  async findByCourse(@Query('maKH') maKH?: number, @Query('id_khoa_hoc') courseId?: number) {
    const rawCourseId = maKH ?? courseId;
    const parsedCourseId = Number(rawCourseId);

    if (rawCourseId === undefined || Number.isNaN(parsedCourseId)) {
      throw new BadRequestException('Thiếu hoặc sai id khóa học');
    }

    try {
      const lessons = await this.lessonsService.findAllByCourse(parsedCourseId);
      return {
        message: 'Lấy danh sách bài học thành công',
        data: lessons.map(serializeLesson),
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lấy danh sách bài học: ' + error.message);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Đảm bảo người dùng phải đăng nhập mới xem được nội dung
  async getLessonDetail(@Param('id', ParseIntPipe) id: number) {
    const lesson = await this.lessonsService.findOne(id);
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học này');
    }
    return {
      message: 'Lấy chi tiết bài học thành công',
      data: serializeLesson(lesson),
    };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('video')) // Bắt trường 'video' từ FormData
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // 1. Chuẩn bị dữ liệu cập nhật
    const updateData = {
      tenBaiHoc: body.tenBaiHoc ?? body.tieu_de,
      noi_dung: body.noi_dung,
      thuTu:
        body.thuTu !== undefined || body.thu_tu !== undefined
          ? Number(body.thuTu ?? body.thu_tu)
          : undefined,
      maKH:
        body.maKH !== undefined || body.id_khoa_hoc !== undefined
          ? Number(body.maKH ?? body.id_khoa_hoc)
          : undefined,
    };

    // 2. Xử lý video mới (nếu có)
    if (file) {
      // Tải video mới lên Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(file, 'video');
      // Thêm link video mới vào payload cập nhật
      updateData['videoURL'] = uploadResult.secure_url;
    }

    // 3. Gọi Service để thực hiện cập nhật vào MySQL
    const lesson = await this.lessonsService.update(id, updateData);
    return serializeLesson(lesson);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.lessonsService.remove(id);
      return { message: 'Xóa bài học thành công!' };
    } catch (error: any) {
      throw new InternalServerErrorException('Lỗi khi xóa bài học: ' + error.message);
    }
  }
}
