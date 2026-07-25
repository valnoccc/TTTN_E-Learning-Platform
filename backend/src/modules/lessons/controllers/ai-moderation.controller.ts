import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { VideoIntelligenceService } from '../services/video-intelligence.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Lesson, AiStatus } from '../entities/lesson.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiModerationController {
  constructor(
    private readonly videoIntelligenceService: VideoIntelligenceService,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * GET /ai/quota
   * Trả về thông tin hạn mức AI tháng hiện tại
   * Chỉ dành cho ADMIN và INSTRUCTOR
   */
  @Get('quota')
  @Roles('ADMIN', 'INSTRUCTOR')
  async getQuota() {
    const quota = await this.videoIntelligenceService.getQuotaStatus();
    return {
      message: 'Thông tin hạn mức AI tháng hiện tại',
      data: quota,
    };
  }

  /**
   * GET /ai/debug-approve-all
   * Dùng riêng cho môi trường DEV để ép duyệt tất cả video bị kẹt PENDING
   */
  @Get('debug-approve-all')
  async debugApproveAll() {
    await this.lessonRepository.update(
      { aiStatus: AiStatus.PENDING },
      {
        aiStatus: AiStatus.APPROVED,
        aiLabels: ['Lập trình', 'Giáo dục (Dev Mode)'],
        aiRejectReason: null,
      },
    );
    await this.lessonRepository.update(
      { aiStatus: AiStatus.PROCESSING },
      {
        aiStatus: AiStatus.APPROVED,
        aiLabels: ['Lập trình', 'Giáo dục (Dev Mode)'],
        aiRejectReason: null,
      },
    );
    await this.lessonRepository.update(
      { aiStatus: AiStatus.NEEDS_REVIEW },
      {
        aiStatus: AiStatus.APPROVED,
        aiLabels: ['Lập trình', 'Giáo dục (Dev Mode)'],
        aiRejectReason: null,
      },
    );
    return { message: 'Đã duyệt tất cả video đang chờ!' };
  }

  /**
   * GET /ai/dev-migrate-video-fields
   * [DEV ONLY] Chạy migration thêm cột VideoSourceType và Resolution vào bảng BaiHoc.
   * Tự động bỏ qua nếu cột đã tồn tại.
   */
  @Get('dev-migrate-video-fields')
  async devMigrateVideoFields() {
    const results: string[] = [];

    const migrations = [
      {
        name: 'Modify VideoURL → varchar(1024)',
        sql: 'ALTER TABLE BaiHoc MODIFY COLUMN VideoURL varchar(1024) NULL',
      },
      {
        name: 'Modify AiRejectReason → varchar(1000)',
        sql: 'ALTER TABLE BaiHoc MODIFY COLUMN AiRejectReason varchar(1000) NULL',
      },
      {
        name: "Add VideoSourceType ENUM('UPLOAD','YOUTUBE')",
        sql: "ALTER TABLE BaiHoc ADD COLUMN VideoSourceType ENUM('UPLOAD','YOUTUBE') NULL DEFAULT 'UPLOAD'",
      },
      {
        name: 'Add Resolution INT',
        sql: 'ALTER TABLE BaiHoc ADD COLUMN Resolution INT NULL',
      },
    ];

    for (const m of migrations) {
      try {
        await this.dataSource.query(m.sql);
        results.push(`✅ ${m.name}`);
      } catch (err: any) {
        const msg: string = err?.message ?? '';
        if (
          msg.toLowerCase().includes('duplicate column') ||
          msg.toLowerCase().includes('already exists') ||
          err?.code === 'ER_DUP_FIELDNAME'
        ) {
          results.push(`⚠️  ${m.name} — already exists, skipped`);
        } else {
          results.push(`❌ ${m.name} — ${msg}`);
        }
      }
    }

    return {
      message: 'Migration video fields complete',
      results,
    };
  }
}
