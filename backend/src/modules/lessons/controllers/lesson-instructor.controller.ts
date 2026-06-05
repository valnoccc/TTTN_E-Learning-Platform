import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CloudinaryService,
  type UploadedAsset,
} from '../../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { serializeLesson } from '../services/lesson-response.util';
import { LessonsService } from '../services/lessons.service';

const LESSON_TITLE_MAX_LENGTH = 60;

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @Request() req,
    @Body() lessonData: any,
    @UploadedFile() file: UploadedAsset,
  ) {
    try {
      let videoUrl = null;

      if (file) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          file,
          'video',
        );
        videoUrl = uploadResult.secure_url;
      }

      const payload = {
        maKH: Number(lessonData.maKH ?? lessonData.id_khoa_hoc),
        tenBaiHoc: lessonData.tenBaiHoc ?? lessonData.tieu_de,
        noi_dung: lessonData.noi_dung || '',
        thuTu: Number(lessonData.thuTu ?? lessonData.thu_tu ?? 0),
        videoURL: videoUrl,
      };

      if (!payload.tenBaiHoc || !String(payload.tenBaiHoc).trim()) {
        throw new BadRequestException('Tên bài học không được để trống');
      }
      if (String(payload.tenBaiHoc).trim().length > LESSON_TITLE_MAX_LENGTH) {
        throw new BadRequestException(
          `Tên bài học không được vượt quá ${LESSON_TITLE_MAX_LENGTH} ký tự`,
        );
      }

      const newLesson = await this.lessonsService.create(payload);

      return {
        message: 'Thêm bài học thành công',
        data: serializeLesson(newLesson),
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Lỗi khi thêm bài học: ' + error.message,
      );
    }
  }

  @Get()
  async findByCourse(
    @Query('maKH') maKH?: number,
    @Query('id_khoa_hoc') courseId?: number,
  ) {
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
      throw new InternalServerErrorException(
        'Lỗi khi lấy danh sách bài học: ' + error.message,
      );
    }
  }

  @Get(':id')
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
  @UseInterceptors(FileInterceptor('video'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file: UploadedAsset,
  ) {
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

    if (typeof updateData.tenBaiHoc === 'string') {
      const trimmed = updateData.tenBaiHoc.trim();
      if (!trimmed) {
        throw new BadRequestException('Tên bài học không được để trống');
      }
      if (trimmed.length > LESSON_TITLE_MAX_LENGTH) {
        throw new BadRequestException(
          `Tên bài học không được vượt quá ${LESSON_TITLE_MAX_LENGTH} ký tự`,
        );
      }
      updateData.tenBaiHoc = trimmed;
    }

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'video',
      );
      updateData['videoURL'] = uploadResult.secure_url;
    }

    const lesson = await this.lessonsService.update(id, updateData);
    return serializeLesson(lesson);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.lessonsService.remove(id);
      return { message: 'Xóa bài học thành công!' };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Lỗi khi xóa bài học: ' + error.message,
      );
    }
  }
}
