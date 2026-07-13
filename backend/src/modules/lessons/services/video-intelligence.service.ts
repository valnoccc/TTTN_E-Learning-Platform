import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';

import { AiQuotaTracker } from '../entities/ai-quota-tracker.entity';
import { AiStatus, Lesson } from '../entities/lesson.entity';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/notifications.service';

const QUOTA_LIMIT_SECONDS = 60_000;
const QUOTA_WARNING_SECONDS = 54_000;

export interface VideoModerationResult {
  lessonId: number;
  status: AiStatus;
  labels: string[];
  rejectReason: string | null;
  durationSeconds: number;
  riskyFrameCount: number;
  likelyFrameCount: number;
}

type VideoModerationDecision = Omit<VideoModerationResult, 'lessonId'>;

@Injectable()
export class VideoIntelligenceService implements OnModuleInit {
  private readonly logger = new Logger(VideoIntelligenceService.name);
  private readonly client: VideoIntelligenceServiceClient;
  private aiStatusSchemaReady: Promise<void> | null = null;
  private moderationWorkerTimer: ReturnType<typeof setInterval> | null = null;
  private moderationWorkerBusy = false;

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(AiQuotaTracker)
    private readonly quotaRepository: Repository<AiQuotaTracker>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {
    this.client = new VideoIntelligenceServiceClient();
    this.logger.log('VideoIntelligenceService initialized');
  }

  async onModuleInit() {
    await this.ensureAiStatusSchema();
    this.startModerationWorker();
  }

  private async ensureAiStatusSchema() {
    if (!this.aiStatusSchemaReady) {
      this.aiStatusSchemaReady = (async () => {
        await this.lessonRepository.query(
          `ALTER TABLE \`BaiHoc\`
           MODIFY COLUMN \`AiStatus\` ENUM('PENDING','PROCESSING','APPROVED','REJECTED','NEEDS_REVIEW') NULL DEFAULT NULL`,
        );
      })();
    }

    return this.aiStatusSchemaReady;
  }

  private startModerationWorker() {
    if (this.moderationWorkerTimer) {
      return;
    }

    void this.processQueuedVideos();
    this.moderationWorkerTimer = setInterval(() => {
      void this.processQueuedVideos();
    }, 5000);
  }

  private async processQueuedVideos() {
    if (this.moderationWorkerBusy) {
      return;
    }

    this.moderationWorkerBusy = true;
    try {
      const queuedLessons: Array<{
        maBH?: number | string;
        maKH?: number | string;
        tenBaiHoc?: string | null;
        videoURL?: string | null;
        thoiLuong?: number | string | null;
        tenKhoaHoc?: string | null;
        maND_GiangVien?: number | string;
      }> = await this.dataSource.query(
        `
          SELECT
            bh.MaBH AS maBH,
            bh.MaKH AS maKH,
            bh.TenBaiHoc AS tenBaiHoc,
            bh.VideoURL AS videoURL,
            bh.ThoiLuong AS thoiLuong,
            kh.TenKhoaHoc AS tenKhoaHoc,
            kh.MaND_GiangVien AS maND_GiangVien
          FROM BaiHoc bh
          INNER JOIN KhoaHoc kh ON kh.MaKH = bh.MaKH
          WHERE bh.AiStatus IN ('PROCESSING', 'PENDING')
            AND bh.VideoURL IS NOT NULL
            AND bh.VideoURL <> ''
          ORDER BY bh.ThuTu ASC, bh.MaBH ASC
          LIMIT 10
        `,
      );

      for (const lesson of queuedLessons) {
        await this.processQueuedLesson(lesson);
      }
    } catch (error) {
      this.logger.error('Không thể xử lý hàng đợi video AI nền:', error);
    } finally {
      this.moderationWorkerBusy = false;
    }
  }

  private getCurrentMonthYear(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${year}`;
  }

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
        `Vượt quá hạn mức 1.000 phút AI miễn phí/tháng (đã dùng ${usedMinutes} phút). Không thể kiểm duyệt video lúc này.`,
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

  async incrementQuota(durationSeconds: number): Promise<void> {
    const monthYear = this.getCurrentMonthYear();
    try {
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

  private async processQueuedLesson(lesson: {
    maBH?: number | string;
    maKH?: number | string;
    tenBaiHoc?: string | null;
    videoURL?: string | null;
    thoiLuong?: number | string | null;
    tenKhoaHoc?: string | null;
    maND_GiangVien?: number | string;
  }) {
    const lessonId = Number(lesson.maBH ?? 0);
    const courseId = Number(lesson.maKH ?? 0);
    const instructorId = Number(lesson.maND_GiangVien ?? 0);
    const videoUrl = String(lesson.videoURL ?? '').trim();

    if (!lessonId || !courseId || !instructorId || !videoUrl) {
      return;
    }

    const currentLessonRows: Array<{
      videoURL?: string | null;
      aiStatus?: string | null;
    }> = await this.dataSource.query(
      `SELECT VideoURL AS videoURL, AiStatus AS aiStatus FROM BaiHoc WHERE MaBH = ? LIMIT 1`,
      [lessonId],
    );
    const currentLesson = currentLessonRows[0];

    if (!currentLesson) {
      return;
    }

    if (String(currentLesson.videoURL ?? '').trim() !== videoUrl) {
      this.logger.log(
        `[Lesson ${lessonId}] Bỏ qua video cũ vì lesson đã được cập nhật sang file khác`,
      );
      return;
    }

    if (
      currentLesson.aiStatus !== 'PROCESSING' &&
      currentLesson.aiStatus !== 'PENDING'
    ) {
      return;
    }

    const durationSeconds = Number(lesson.thoiLuong ?? 0) || 0;
    const result = await this.moderateLessonVideo(
      lessonId,
      videoUrl,
      durationSeconds,
    );

    await this.sendModerationNotification({
      lessonId,
      courseId,
      instructorId,
      lessonTitle: lesson.tenBaiHoc ?? `Bài ${lessonId}`,
      courseTitle: lesson.tenKhoaHoc ?? `Khóa học ${courseId}`,
      result,
    });
  }

  private async sendModerationNotification(input: {
    lessonId: number;
    courseId: number;
    instructorId: number;
    lessonTitle: string;
    courseTitle: string;
    result: VideoModerationResult;
  }) {
    const { instructorId, lessonTitle, courseTitle, result } = input;
    const titleByStatus: Record<AiStatus, string> = {
      PENDING: 'Video đang chờ kiểm duyệt',
      PROCESSING: 'Video đang được xử lý',
      APPROVED: 'Video đã được duyệt',
      REJECTED: 'Video bị từ chối',
      NEEDS_REVIEW: 'Video cần admin duyệt thêm',
    };

    const messageByStatus: Record<AiStatus, string> = {
      PENDING: `Video của bài "${lessonTitle}" trong khóa học "${courseTitle}" đang chờ xử lý.`,
      PROCESSING: `Video của bài "${lessonTitle}" trong khóa học "${courseTitle}" đang được AI xử lý.`,
      APPROVED: `Video của bài "${lessonTitle}" trong khóa học "${courseTitle}" đã được AI duyệt. Bạn có thể tiếp tục hoàn thiện các bài học khác.`,
      REJECTED: `Video của bài "${lessonTitle}" trong khóa học "${courseTitle}" bị từ chối. Lý do: ${result.rejectReason || 'Không có lý do cụ thể'}.`,
      NEEDS_REVIEW: `Video của bài "${lessonTitle}" trong khóa học "${courseTitle}" cần admin xem xét thêm. Lý do: ${result.rejectReason || 'Không có lý do cụ thể'}.`,
    };

    await this.notificationsService.createNotification({
      maND: instructorId,
      maNguoiGui: null,
      loaiThongBao: NotificationType.COURSE,
      tieuDe: titleByStatus[result.status],
      noiDung: messageByStatus[result.status],
      daDoc: false,
    });
  }

  analyzeVideoBackground(lessonId: number, videoUrl: string): void {
    void this.runAnalysis(lessonId, videoUrl).catch((err) => {
      this.logger.error(`[Lesson ${lessonId}] Phân tích video thất bại:`, err);
    });
  }

  async moderateLessonVideo(
    lessonId: number,
    videoUrl: string,
    durationSeconds = 0,
  ): Promise<VideoModerationResult> {
    if (durationSeconds > 0) {
      try {
        await this.checkQuota(durationSeconds);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const reviewReason = `Lỗi kỹ thuật khi phân tích: ${message}`;

        await this.lessonRepository.update(lessonId, {
          aiStatus: AiStatus.NEEDS_REVIEW,
          aiLabels: null,
          aiRejectReason: reviewReason,
        });

        return {
          lessonId,
          status: AiStatus.NEEDS_REVIEW,
          labels: [],
          rejectReason: reviewReason,
          durationSeconds: 0,
          riskyFrameCount: 0,
          likelyFrameCount: 0,
        };
      }
    }

    return this.runAnalysis(lessonId, videoUrl);
  }

  private async runAnalysis(
    lessonId: number,
    videoUrl: string,
  ): Promise<VideoModerationResult> {
    this.logger.log(
      `[Lesson ${lessonId}] Bắt đầu phân tích video: ${videoUrl}`,
    );

    await this.lessonRepository.update(lessonId, {
      aiStatus: AiStatus.PROCESSING,
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

      const decision = this.evaluateAnnotation(annotation);
      durationSeconds = decision.durationSeconds;

      await this.lessonRepository.update(lessonId, {
        aiStatus: decision.status,
        aiLabels: decision.labels,
        aiRejectReason: decision.rejectReason,
        thoiLuong: durationSeconds,
        durationSeconds,
      });

      if (decision.status === AiStatus.REJECTED) {
        this.logger.warn(
          `[Lesson ${lessonId}] Video bị từ chối (risky=${decision.riskyFrameCount}, likely=${decision.likelyFrameCount})`,
        );
      } else if (decision.status === AiStatus.NEEDS_REVIEW) {
        this.logger.warn(
          `[Lesson ${lessonId}] Video cần admin xem xét (risky=${decision.riskyFrameCount}, likely=${decision.likelyFrameCount})`,
        );
      } else {
        this.logger.log(
          `[Lesson ${lessonId}] Video được duyệt. Labels: ${decision.labels.join(', ') || 'none'}`,
        );
      }

      return {
        lessonId,
        ...decision,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const reviewReason = `Lỗi kỹ thuật khi phân tích: ${message}`;

      this.logger.error(
        `[Lesson ${lessonId}] Lỗi phân tích: ${message} | videoUrl=${videoUrl}`,
      );

      await this.lessonRepository.update(lessonId, {
        aiStatus: AiStatus.NEEDS_REVIEW,
        aiLabels: null,
        aiRejectReason: reviewReason,
      });

      return {
        lessonId,
        status: AiStatus.NEEDS_REVIEW,
        labels: [],
        rejectReason: reviewReason,
        durationSeconds,
        riskyFrameCount: 0,
        likelyFrameCount: 0,
      };
    } finally {
      if (durationSeconds > 0) {
        await this.incrementQuota(durationSeconds);
        this.logger.log(
          `[Lesson ${lessonId}] Đã cộng ${durationSeconds}s vào quota tháng này`,
        );
      }
    }
  }

  private evaluateAnnotation(annotation: any): VideoModerationDecision {
    const segmentDuration = annotation.segment?.endTimeOffset?.seconds ?? 0;
    const durationSeconds = Number(segmentDuration) || 0;

    const sensitiveFrames = annotation.explicitAnnotation?.frames ?? [];
    const riskyFrames = sensitiveFrames.filter((frame: any) => {
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

    const likelyFrames = sensitiveFrames.filter((frame: any) => {
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

    const allLabels = [
      ...(annotation.shotLabelAnnotations ?? []),
      ...(annotation.segmentLabelAnnotations ?? []),
    ];

    const labels: string[] = allLabels
      .map(
        (label: { entity?: { description?: string } }) =>
          label.entity?.description ?? '',
      )
      .filter(Boolean)
      .slice(0, 5);

    this.logger.log(
      `[Video AI] explicit=${sensitiveFrames.length}, risky=${riskyFrames.length}, likely=${likelyFrames.length}, labels=${JSON.stringify(labels)}`,
    );

    const hasStrongExplicitSignal =
      riskyFrames.length >= 1 ||
      likelyFrames.length >= 3 ||
      labels.some((label) =>
        ['violence', 'adult', 'nude', 'sexual', 'weapon'].includes(
          label.toLowerCase(),
        ),
      );

    if (hasStrongExplicitSignal) {
      return {
        status: AiStatus.REJECTED,
        labels,
        rejectReason:
          'Video chứa tín hiệu nội dung nhạy cảm đủ mạnh để từ chối tự động.',
        durationSeconds,
        riskyFrameCount: riskyFrames.length,
        likelyFrameCount: likelyFrames.length,
      };
    }

    const needsReview =
      likelyFrames.length >= 1 ||
      labels.some((label) =>
        ['violence', 'adult', 'nude', 'sexual', 'weapon'].includes(
          label.toLowerCase(),
        ),
      );

    if (needsReview) {
      return {
        status: AiStatus.NEEDS_REVIEW,
        labels,
        rejectReason:
          'Video có tín hiệu chưa đủ chắc chắn, cần admin xem xét thủ công.',
        durationSeconds,
        riskyFrameCount: riskyFrames.length,
        likelyFrameCount: likelyFrames.length,
      };
    }

    return {
      status: AiStatus.APPROVED,
      labels,
      rejectReason: null,
      durationSeconds,
      riskyFrameCount: riskyFrames.length,
      likelyFrameCount: likelyFrames.length,
    };
  }
}
