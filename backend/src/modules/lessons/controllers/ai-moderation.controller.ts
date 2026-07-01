import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { VideoIntelligenceService } from '../services/video-intelligence.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson, AiStatus } from '../entities/lesson.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiModerationController {
  constructor(
    private readonly videoIntelligenceService: VideoIntelligenceService,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
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
    return { message: 'Đã duyệt tất cả video đang chờ!' };
  }
}
