import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import * as path from 'path';

import { Lesson, AiStatus } from '../entities/lesson.entity';
import { AiQuotaTracker } from '../entities/ai-quota-tracker.entity';

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
  async analyzeVideoBackground(
    lessonId: number,
    videoUrl: string,
  ): Promise<void> {
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
      const RISKY_LIKELIHOOD = [3, 4]; // LIKELY = 3, VERY_LIKELY = 4 trong Google Enum
      const RISKY_STRINGS = ['LIKELY', 'VERY_LIKELY'];

      const hasSensitiveContent = sensitiveFrames.some((frame) => {
        const likelihood = frame.pornographyLikelihood;
        if (typeof likelihood === 'number') {
          return RISKY_LIKELIHOOD.includes(likelihood);
        }
        if (typeof likelihood === 'string') {
          return RISKY_STRINGS.includes(likelihood.toUpperCase());
        }
        return false;
      });

      if (hasSensitiveContent) {
        // Từ chối video vi phạm
        await this.lessonRepository.update(lessonId, {
          aiStatus: AiStatus.REJECTED,
          aiRejectReason:
            'Video chứa nội dung khiêu dâm hoặc bạo lực mức LIKELY/VERY_LIKELY theo Google Video Intelligence AI.',
          durationSeconds,
        });
        this.logger.warn(
          `[Lesson ${lessonId}] Video BỊ TỪ CHỐI - Nội dung nhạy cảm`,
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
          durationSeconds,
        });
        this.logger.log(
          `[Lesson ${lessonId}] Video ĐƯỢC DUYỆT. Labels: ${top5Labels.join(', ')}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`[Lesson ${lessonId}] Lỗi phân tích:`, error.message);
      // Đánh dấu lỗi kỹ thuật - không reject hẳn
      await this.lessonRepository.update(lessonId, {
        aiStatus: AiStatus.REJECTED,
        aiRejectReason: `Lỗi kỹ thuật khi phân tích: ${error.message}`,
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
}
