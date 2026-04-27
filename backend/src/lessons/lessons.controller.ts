import {
  Controller, Post, Body, UseInterceptors, UploadedFile,
  UseGuards, Request, InternalServerErrorException, Get, Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonsService } from './lessons.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
        id_khoa_hoc: Number(lessonData.id_khoa_hoc),
        tieu_de: lessonData.tieu_de,
        noi_dung: lessonData.noi_dung || '',
        thu_tu: Number(lessonData.thu_tu || 0),
        video_url: videoUrl,
      };

      // 3. Gọi service để lưu bài học
      const newLesson = await this.lessonsService.create(payload);

      return {
        message: 'Thêm bài học thành công',
        data: newLesson,
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Lỗi khi thêm bài học: ' + error.message);
    }
  }

  @Get()
  async findByCourse(@Query('id_khoa_hoc') courseId: number) {
    try {
      const lessons = await this.lessonsService.findAllByCourse(courseId);
      return {
        message: 'Lấy danh sách bài học thành công',
        data: lessons,
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Lỗi khi lấy danh sách bài học: ' + error.message);
    }
  }

}