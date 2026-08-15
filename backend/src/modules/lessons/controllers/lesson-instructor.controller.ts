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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  LessonVideoStorageService,
  type LessonVideoUploadResult,
} from '../../lesson-video-storage/lesson-video-storage.service';
import { serializeLesson } from '../services/lesson-response.util';
import { LessonsService } from '../services/lessons.service';
import { VideoSourceType } from '../entities/lesson.entity';
import {
  extractVideoMetadata,
  validateVideoMetadata,
} from '../services/video-metadata.util';

const LESSON_TITLE_MAX_LENGTH = 60;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm'];

// ─── Regex validate YouTube URL ─────────────────────────────────────────────
const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w\-]{11}(\S*)?$/i;

function isValidYoutubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url.trim());
}

// ─── Helper parsers ──────────────────────────────────────────────────────────
function parseBooleanLike(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no'].includes(normalized)) return false;
  }
  return fallback;
}

function parseVideoDuration(value: unknown): number {
  const duration = Number(value ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.round(duration);
}

function parseVideoSourceType(value: unknown): VideoSourceType {
  if (value === VideoSourceType.YOUTUBE) return VideoSourceType.YOUTUBE;
  return VideoSourceType.UPLOAD;
}

// ─── Multer options ──────────────────────────────────────────────────────────
const videoUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `Định dạng file không được hỗ trợ: "${file.mimetype}". Chỉ chấp nhận MP4 và WebM.`,
        ),
        false,
      );
    }
  },
};

// ─── Controller ──────────────────────────────────────────────────────────────
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly lessonVideoStorageService: LessonVideoStorageService,
  ) {}

  // ─── POST /lessons ──────────────────────────────────────────────────────────
  @Post()
  @UseInterceptors(FileInterceptor('video', videoUploadOptions))
  async create(
    @Body() lessonData: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const videoSourceType = parseVideoSourceType(
      lessonData.videoSourceType ?? lessonData.video_source_type,
    );
    const youtubeUrl: string | null =
      lessonData.youtubeUrl ?? lessonData.youtube_url ?? null;

    // ── Validate YouTube URL ──
    if (videoSourceType === VideoSourceType.YOUTUBE) {
      if (!youtubeUrl || !isValidYoutubeUrl(youtubeUrl)) {
        throw new BadRequestException(
          'Link YouTube không hợp lệ. Vui lòng nhập đúng định dạng URL YouTube.',
        );
      }
    }

    let uploadedVideo: LessonVideoUploadResult | null = null;
    let videoMetadataResolution: number | null = null;
    let computedDuration = parseVideoDuration(
      lessonData.thoiLuong ?? lessonData.thoi_luong,
    );

    try {
      if (videoSourceType === VideoSourceType.UPLOAD && file) {
        // ── Đọc & validate metadata video ──
        const metadata = await extractVideoMetadata(
          file.buffer,
          file.originalname,
        );
        if (metadata) {
          validateVideoMetadata(metadata); // Throws 400 nếu vi phạm
          computedDuration = metadata.duration || computedDuration;
          videoMetadataResolution = metadata.resolution;
        }

        uploadedVideo = await this.lessonVideoStorageService.uploadVideo(file, {
          courseId: Number(lessonData.maKH ?? lessonData.id_khoa_hoc),
        });
      }

      const tenBaiHoc = lessonData.tenBaiHoc ?? lessonData.tieu_de;
      if (!tenBaiHoc || !String(tenBaiHoc).trim()) {
        throw new BadRequestException('Tên bài học không được để trống');
      }
      if (String(tenBaiHoc).trim().length > LESSON_TITLE_MAX_LENGTH) {
        throw new BadRequestException(
          `Tên bài học không được vượt quá ${LESSON_TITLE_MAX_LENGTH} ký tự`,
        );
      }

      const payload = {
        maKH: Number(lessonData.maKH ?? lessonData.id_khoa_hoc),
        tenBaiHoc: String(tenBaiHoc).trim(),
        noi_dung: lessonData.noi_dung || '',
        thuTu: Number(lessonData.thuTu ?? lessonData.thu_tu ?? 0),
        choPhepXemTruoc: parseBooleanLike(
          lessonData.choPhepXemTruoc ?? lessonData.cho_phep_xem_truoc,
        ),
        videoURL:
          videoSourceType === VideoSourceType.YOUTUBE
            ? youtubeUrl
            : (uploadedVideo?.gcsUri ?? null),
        videoSourceType,
        thoiLuong: computedDuration,
        durationSeconds: computedDuration,
        resolution: videoMetadataResolution,
        aiStatus: null,
        aiLabels: null,
        aiRejectReason: null,
        videoDraft: uploadedVideo
          ? {
              objectName: uploadedVideo.objectName,
              videoUrl: uploadedVideo.gcsUri,
              videoSourceType: VideoSourceType.UPLOAD,
              durationSeconds: computedDuration,
              resolution: videoMetadataResolution,
              aiStatus: 'PROCESSING',
            }
          : undefined,
      };

      const newLesson = await this.lessonsService.create(payload);

      if (uploadedVideo && file) {
        await this.lessonVideoStorageService.recordMonthlyUsage(
          file.size ?? file.buffer?.length ?? 0,
        );
      }

      return {
        message: 'Thêm bài học thành công',
        data: await this.serializeLessonResponse(newLesson),
      };
    } catch (error: any) {
      // Rollback video nếu lỗi xảy ra sau khi đã upload
      if (uploadedVideo) {
        await this.lessonVideoStorageService
          .deleteVideo(uploadedVideo.gcsUri ?? uploadedVideo.url)
          .catch(() => undefined);
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Lỗi khi thêm bài học: ' + error.message,
      );
    }
  }

  // ─── GET /lessons ───────────────────────────────────────────────────────────
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Lỗi khi lấy danh sách bài học: ' + error.message,
      );
    }
  }

  // ─── GET /lessons/:id ───────────────────────────────────────────────────────
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

  // ─── PUT /lessons/:id ───────────────────────────────────────────────────────
  @Put(':id')
  @UseInterceptors(FileInterceptor('video', videoUploadOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const videoSourceType = parseVideoSourceType(
      body.videoSourceType ?? body.video_source_type,
    );
    const youtubeUrl: string | null =
      body.youtubeUrl ?? body.youtube_url ?? null;

    // ── Validate YouTube URL ──
    if (videoSourceType === VideoSourceType.YOUTUBE) {
      if (!youtubeUrl || !isValidYoutubeUrl(youtubeUrl)) {
        throw new BadRequestException(
          'Link YouTube không hợp lệ. Vui lòng nhập đúng định dạng URL YouTube.',
        );
      }
    }

    const updateData: Record<string, any> = {
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

    // ── Xử lý video theo nguồn ──
    if (videoSourceType === VideoSourceType.YOUTUBE) {
      updateData.videoURL = youtubeUrl;
      updateData.videoSourceType = VideoSourceType.YOUTUBE;
      updateData.thoiLuong = 0;
      updateData.durationSeconds = 0;
      updateData.resolution = null;
      updateData.aiStatus = null;
      updateData.aiLabels = null;
      updateData.aiRejectReason = null;
      updateData.videoDraft = undefined;
    } else if (file) {
      // ── Đọc & validate metadata ──
      const metadata = await extractVideoMetadata(
        file.buffer,
        file.originalname,
      );
      if (metadata) {
        validateVideoMetadata(metadata);
        updateData.durationSeconds = metadata.duration;
        updateData.thoiLuong = metadata.duration;
        updateData.resolution = metadata.resolution;
      } else {
        updateData.thoiLuong = parseVideoDuration(
          body.thoiLuong ?? body.thoi_luong,
        );
      }

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
      updateData.videoURL = uploadResult.gcsUri;
      updateData.videoSourceType = VideoSourceType.UPLOAD;
      // Reset AI moderation khi upload video mới
      updateData.aiStatus = 'PROCESSING';
      updateData.aiLabels = null;
      updateData.aiRejectReason = null;
      updateData.videoDraft = {
        objectName: uploadResult.objectName,
        videoUrl: uploadResult.gcsUri,
        videoSourceType: VideoSourceType.UPLOAD,
        durationSeconds: updateData.durationSeconds ?? 0,
        resolution: updateData.resolution ?? null,
        aiStatus: 'PROCESSING',
      };
    }

    const lesson = await this.lessonsService.update(id, updateData);

    if (file && videoSourceType === VideoSourceType.UPLOAD) {
      await this.lessonVideoStorageService.recordMonthlyUsage(
        file.size ?? file.buffer.length ?? 0,
      );
    }

    return this.serializeLessonResponse(lesson);
  }

  // ─── DELETE /lessons/:id ────────────────────────────────────────────────────
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

  // ─── Private helpers ────────────────────────────────────────────────────────
  private async serializeLessonResponse(lesson: any) {
    const isYoutube =
      lesson.videoSourceType === VideoSourceType.YOUTUBE ||
      (typeof lesson.videoURL === 'string' &&
        lesson.videoURL.includes('youtube'));

    // YouTube URL không cần signed URL từ GCS
    const videoURL = isYoutube
      ? (lesson.videoURL ?? null)
      : await this.lessonVideoStorageService.getPlayableUrl(
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
