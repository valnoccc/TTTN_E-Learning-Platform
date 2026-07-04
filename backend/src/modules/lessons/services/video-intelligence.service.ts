import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';

import { Lesson, AiStatus } from '../entities/lesson.entity';
import { AiQuotaTracker } from '../entities/ai-quota-tracker.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';

// Giới hạn hạn mức miễn phí: 60.000 giây = 1.000 phút
const QUOTA_LIMIT_SECONDS = 60_000;
// Ngưỡng cảnh báo: 54.000 giây = 900 phút (90%)
const QUOTA_WARNING_SECONDS = 54_000;

@Injectable()
export class VideoIntelligenceService {
  private readonly logger = new Logger(VideoIntelligenceService.name);
  private readonly client: VideoIntelligenceServiceClient;

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(AiQuotaTracker)
    private readonly quotaRepository: Repository<AiQuotaTracker>,
    @InjectRepository(KhoaHoc)
    private readonly courseRepository: Repository<KhoaHoc>,
  ) {
    // Mặc định Google Cloud SDK sẽ tự động nhận diện biến môi trường GOOGLE_APPLICATION_CREDENTIALS
    this.client = new VideoIntelligenceServiceClient();
    this.logger.log('VideoIntelligenceService initialized');
  }

  /**
   * Lấy key tháng hiện tại: 'MM-YYYY'
   */
  private getCurrentMonthYear(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${year}`;
  }

  /**
   * Kiểm tra hạn mức tháng hiện tại.
   * Nếu usedSeconds + durationSeconds > QUOTA_LIMIT_SECONDS => ném Exception chặn.
   * Nếu sắp hết (> QUOTA_WARNING_SECONDS) => ghi log cảnh báo.
   */
  async checkQuota(durationSeconds: number): Promise<void> {
    const monthYear = this.getCurrentMonthYear();
    let tracker = await this.quotaRepository.findOne({ where: { monthYear } });

    if (!tracker) {
      tracker = this.quotaRepository.create({ monthYear, usedSeconds: 0 });
      await this.quotaRepository.save(tracker);
    }

    const projectedTotal = tracker.usedSeconds + durationSeconds;

    if (projectedTotal > QUOTA_LIMIT_SECONDS) {
      const usedMinutes = Math.ceil(tracker.usedSeconds / 60);
      throw new HttpException(
        `Vượt quá hạn mức 1.000 phút AI miễn phí/tháng (đã dùng ${usedMinutes} phút). Không thể kiểm duyệt video lúc này. Hạn mức sẽ được đặt lại vào tháng sau.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (projectedTotal > QUOTA_WARNING_SECONDS) {
      const usedMinutes = Math.ceil(tracker.usedSeconds / 60);
      this.logger.warn(
        `⚠️ QUOTA WARNING: Đã dùng ${usedMinutes}/1000 phút AI trong tháng ${monthYear}. Sắp đạt giới hạn!`,
      );
    }
  }

  /**
   * Cộng dồn số giây đã dùng vào bảng AiQuotaTracker.
   * Gọi sau khi phân tích xong (dù duyệt hay từ chối).
   */
  async incrementQuota(durationSeconds: number): Promise<void> {
    const monthYear = this.getCurrentMonthYear();
    try {
      // Dùng INSERT ... ON DUPLICATE KEY UPDATE để atomic operation
      await this.quotaRepository.query(
        `INSERT INTO AiQuotaTracker (MonthYear, UsedSeconds)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE UsedSeconds = UsedSeconds + ?`,
        [monthYear, durationSeconds, durationSeconds],
      );
    } catch (error) {
      this.logger.error('Lỗi khi cập nhật quota tracker:', error);
    }
  }

  /**
   * Lấy thông tin quota tháng hiện tại (dùng cho API)
   */
  async getQuotaStatus(): Promise<{
    monthYear: string;
    usedSeconds: number;
    usedMinutes: number;
    limitMinutes: number;
    percentUsed: number;
    isWarning: boolean;
    isExceeded: boolean;
  }> {
    const monthYear = this.getCurrentMonthYear();
    const tracker = await this.quotaRepository.findOne({
      where: { monthYear },
    });
    const usedSeconds = tracker?.usedSeconds ?? 0;
    const usedMinutes = Math.floor(usedSeconds / 60);
    const limitMinutes = QUOTA_LIMIT_SECONDS / 60;
    const percentUsed = Math.round((usedSeconds / QUOTA_LIMIT_SECONDS) * 100);

    return {
      monthYear,
      usedSeconds,
      usedMinutes,
      limitMinutes,
      percentUsed,
      isWarning: usedSeconds >= QUOTA_WARNING_SECONDS,
      isExceeded: usedSeconds >= QUOTA_LIMIT_SECONDS,
    };
  }

  /**
   * Phân tích video bằng Google Video Intelligence API.
   * Chạy ngầm (fire-and-forget) để không block luồng chính.
   */
  analyzeVideoBackground(lessonId: number, videoUrl: string): void {
    // Không dùng await khi gọi - fire and forget
    this.runAnalysis(lessonId, videoUrl).catch((err) => {
      this.logger.error(`[Lesson ${lessonId}] Phân tích video thất bại:`, err);
    });
  }

  private async runAnalysis(lessonId: number, videoUrl: string): Promise<void> {
    this.logger.log(
      `[Lesson ${lessonId}] Bắt đầu phân tích video: ${videoUrl}`,
    );

    // Cập nhật trạng thái PENDING
    await this.lessonRepository.update(lessonId, {
      aiStatus: AiStatus.PENDING,
      aiLabels: null,
      aiRejectReason: null,
    });

    let durationSeconds = 0;

    try {
      const [operation] = await this.client.annotateVideo({
        inputUri: videoUrl,
        features: [
          'EXPLICIT_CONTENT_DETECTION' as any,
          'LABEL_DETECTION' as any,
        ],
      });

      this.logger.log(
        `[Lesson ${lessonId}] Đã gửi video, đang chờ Google phân tích...`,
      );
      const [result] = await operation.promise();

      const annotation = result.annotationResults?.[0];
      if (!annotation) {
        throw new Error('Không nhận được kết quả phân tích từ Google');
      }

      // Lấy thời lượng video
      const segmentDuration = annotation.segment?.endTimeOffset?.seconds ?? 0;
      durationSeconds = Number(segmentDuration) || 0;

      // Kiểm tra nội dung nhạy cảm
      const sensitiveFrames = annotation.explicitAnnotation?.frames ?? [];
      const riskyFrames = sensitiveFrames.filter((frame) => {
        const likelihood = frame.pornographyLikelihood;
        if (typeof likelihood === 'number') {
          const numericLikelihood = Number(likelihood);
          return Number.isFinite(numericLikelihood) && numericLikelihood >= 4;
        }
        if (typeof likelihood === 'string') {
          return likelihood.toUpperCase() === 'VERY_LIKELY';
        }
        return false;
      });

      const frameLogPayload = sensitiveFrames.map((frame, index) => {
        const likelihood = frame.pornographyLikelihood;
        const timeOffset =
          typeof frame.timeOffset === 'string'
            ? frame.timeOffset
            : frame.timeOffset && typeof frame.timeOffset === 'object'
              ? JSON.stringify(frame.timeOffset)
              : 'unknown';

        return {
          index: index + 1,
          likelihood,
          timeOffset,
        };
      });

      const likelyFrames = sensitiveFrames.filter((frame) => {
        const likelihood = frame.pornographyLikelihood;
        if (typeof likelihood === 'number') {
          const numericLikelihood = Number(likelihood);
          return Number.isFinite(numericLikelihood) && numericLikelihood === 3;
        }
        if (typeof likelihood === 'string') {
          return likelihood.toUpperCase() === 'LIKELY';
        }
        return false;
      });

      this.logger.log(
        `[Lesson ${lessonId}] AI explicit frames=${sensitiveFrames.length}, risky=${riskyFrames.length}, likely=${likelyFrames.length}, details=${JSON.stringify(frameLogPayload)}`,
      );

      // Chỉ reject khi AI thấy bằng chứng đủ mạnh. Một frame VERY_LIKELY
      // đơn lẻ vẫn có thể là false positive ở video giảng dạy, nên cần nhiều
      // tín hiệu hơn trước khi chặn tự động.
      const hasSensitiveContent =
        riskyFrames.length >= 3 ||
        (riskyFrames.length >= 1 && likelyFrames.length >= 4) ||
        likelyFrames.length >= 6;

      if (hasSensitiveContent) {
        // Từ chối video vi phạm
        await this.lessonRepository.update(lessonId, {
          aiStatus: AiStatus.REJECTED,
          aiRejectReason:
            'Video chứa nội dung nhạy cảm với mức độ đủ mạnh để bị từ chối tự động theo Google Video Intelligence AI.',
          thoiLuong: durationSeconds,
          durationSeconds,
        });
        this.logger.warn(
          `[Lesson ${lessonId}] Video BỊ TỪ CHỐI - Nội dung nhạy cảm (risky=${riskyFrames.length}, likely=${likelyFrames.length})`,
        );
      } else {
        // Lấy top 5 nhãn phân loại nội dung
        const shotLabels = annotation.shotLabelAnnotations ?? [];
        const segmentLabels = annotation.segmentLabelAnnotations ?? [];
        const allLabels = [...shotLabels, ...segmentLabels];

        const top5Labels: string[] = allLabels
          .map(
            (label: { entity?: { description?: string } }) =>
              label.entity?.description ?? '',
          )
          .filter(Boolean)
          .slice(0, 5);

        await this.lessonRepository.update(lessonId, {
          aiStatus: AiStatus.APPROVED,
          aiLabels: top5Labels,
          aiRejectReason: null,
          thoiLuong: durationSeconds,
          durationSeconds,
        });
        this.logger.log(
          `[Lesson ${lessonId}] Video ĐƯỢC DUYỆT. Labels: ${top5Labels.join(', ') || 'none'}`,
        );
        await this.tryAutoPublishCourse(lessonId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Lesson ${lessonId}] Lỗi phân tích: ${message} | videoUrl=${videoUrl}`,
      );
      // Lỗi kỹ thuật không nên bị hiểu nhầm là vi phạm nội dung.
      // Giữ trạng thái PENDING để giảng viên có thể chờ hệ thống xử lý lại.
      await this.lessonRepository.update(lessonId, {
        aiStatus: AiStatus.PENDING,
        aiRejectReason: null,
      });
    } finally {
      // BẮT BUỘC: Cộng dồn quota dù thành công hay thất bại
      if (durationSeconds > 0) {
        await this.incrementQuota(durationSeconds);
        this.logger.log(
          `[Lesson ${lessonId}] Đã cộng ${durationSeconds}s vào quota tháng này`,
        );
      }
    }
  }

  private async tryAutoPublishCourse(lessonId: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { maBH: lessonId },
      select: ['maKH', 'aiStatus', 'videoURL'],
    });

    if (!lesson?.maKH) {
      return;
    }

    const course = await this.courseRepository.findOne({
      where: { maKH: lesson.maKH },
      select: ['maKH', 'trangThai'],
    });

    if (!course || course.trangThai !== 'PENDING') {
      return;
    }

    const lessons = await this.lessonRepository.find({
      where: { maKH: lesson.maKH },
      select: ['maBH', 'videoURL', 'aiStatus'],
      order: { maBH: 'ASC' },
    });

    const hasRejectedVideo = lessons.some(
      (item) => !!item.videoURL && item.aiStatus === AiStatus.REJECTED,
    );
    const hasPendingVideo = lessons.some(
      (item) => !!item.videoURL && item.aiStatus !== AiStatus.APPROVED,
    );

    if (hasRejectedVideo || hasPendingVideo) {
      return;
    }

    await this.courseRepository.update(course.maKH, {
      trangThai: 'PUBLISHED',
      ngayCapNhat: new Date(),
    });
    this.logger.log(
      `[Course ${course.maKH}] Tự động xuất bản sau khi toàn bộ video được duyệt`,
    );
  }
}
