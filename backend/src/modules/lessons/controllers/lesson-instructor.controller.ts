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
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  LessonVideoStorageService,
  type LessonVideoUploadResult,
} from '../../lesson-video-storage/lesson-video-storage.service';
import { AiStatus } from '../entities/lesson.entity';
import { serializeLesson } from '../services/lesson-response.util';
import { LessonsService } from '../services/lessons.service';
import { VideoIntelligenceService } from '../services/video-intelligence.service';

const LESSON_TITLE_MAX_LENGTH = 60;

function parseBooleanLike(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'off', 'no'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function parseVideoDuration(value: unknown): number {
  const duration = Number(value ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.round(duration);
}

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly lessonVideoStorageService: LessonVideoStorageService,
    private readonly videoIntelligenceService: VideoIntelligenceService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @Request() req,
    @Body() lessonData: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let uploadedVideo: LessonVideoUploadResult | null = null;
    let videoInputUri: string | null = null;
    let payload: {
      maKH: number;
      tenBaiHoc: any;
      noi_dung: string;
      thuTu: number;
      choPhepXemTruoc: boolean;
      videoURL: string | null;
      thoiLuong: number;
    };

    try {
      let videoDuration = parseVideoDuration(
        lessonData.thoiLuong ?? lessonData.thoi_luong,
      );

      if (file) {
        uploadedVideo = await this.lessonVideoStorageService.uploadVideo(file, {
          courseId: Number(lessonData.maKH ?? lessonData.id_khoa_hoc),
        });
        videoInputUri = uploadedVideo.gcsUri;
      }

      payload = {
        maKH: Number(lessonData.maKH ?? lessonData.id_khoa_hoc),
        tenBaiHoc: lessonData.tenBaiHoc ?? lessonData.tieu_de,
        noi_dung: lessonData.noi_dung || '',
        thuTu: Number(lessonData.thuTu ?? lessonData.thu_tu ?? 0),
        choPhepXemTruoc: parseBooleanLike(
          lessonData.choPhepXemTruoc ?? lessonData.cho_phep_xem_truoc,
        ),
        videoURL: uploadedVideo?.gcsUri ?? null,
        thoiLuong: videoDuration,
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

      this.queueLessonAnalysis(newLesson.maBH, videoInputUri, videoDuration);

      return {
        message: 'Thêm bài học thành công',
        data: await this.serializeLessonResponse(newLesson),
      };
    } catch (error: any) {
      if (file) {
        await this.lessonVideoStorageService.deleteVideo(
          uploadedVideo?.gcsUri ?? uploadedVideo?.url,
        );
      }
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
      const serializedLessons = await Promise.all(
        lessons.map((lesson) => this.serializeLessonResponse(lesson)),
      );
      return {
        message: 'Lấy danh sách bài học thành công',
        data: serializedLessons,
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
      data: await this.serializeLessonResponse(lesson),
    };
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('video'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let videoInputUri: string | null = null;
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
      choPhepXemTruoc:
        body.choPhepXemTruoc !== undefined ||
        body.cho_phep_xem_truoc !== undefined
          ? parseBooleanLike(body.choPhepXemTruoc ?? body.cho_phep_xem_truoc)
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
      const uploadResult = await this.lessonVideoStorageService.uploadVideo(
        file,
        {
          courseId:
            body.maKH !== undefined || body.id_khoa_hoc !== undefined
              ? Number(body.maKH ?? body.id_khoa_hoc)
              : undefined,
          lessonId: id,
        },
      );
      updateData['videoURL'] = uploadResult.gcsUri;
      videoInputUri = uploadResult.gcsUri;
      updateData['thoiLuong'] = parseVideoDuration(
        body.thoiLuong ?? body.thoi_luong,
      );

      // Đặt lại trạng thái AI về chờ xử lý khi video thay đổi
      updateData['aiStatus'] = AiStatus.PENDING;
      updateData['aiLabels'] = null;
      updateData['aiRejectReason'] = null;
    }

    const lesson = await this.lessonsService.update(id, updateData);

    this.queueLessonAnalysis(
      lesson.maBH,
      videoInputUri,
      updateData['thoiLuong'] as number,
    );

    return this.serializeLessonResponse(lesson);
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

  private queueLessonAnalysis(
    lessonId: number,
    videoUrl: string | null | undefined,
    videoDuration: number,
  ) {
    if (!videoUrl) {
      return;
    }

    if (videoDuration > 0) {
      this.videoIntelligenceService
        .checkQuota(videoDuration)
        .then(() => {
          return this.videoIntelligenceService.analyzeVideoBackground(
            lessonId,
            videoUrl,
          );
        })
        .catch((quotaErr) => {
          console.warn(
            `[AI Quota] Bỏ qua kiểm duyệt bài học ${lessonId}: ${quotaErr.message}`,
          );
        });
      return;
    }

    this.videoIntelligenceService.analyzeVideoBackground(lessonId, videoUrl);
  }

  private async serializeLessonResponse(lesson: any) {
    const videoURL = await this.lessonVideoStorageService.getPlayableUrl(
      lesson.videoURL ?? lesson.video_url ?? null,
    );
    const serialized = serializeLesson(lesson);
    return {
      ...serialized,
      videoURL,
      video_url: videoURL,
    };
  }
}
