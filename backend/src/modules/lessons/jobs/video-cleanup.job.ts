import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoCleanupService } from '../services/video-cleanup.service';

@Injectable()
export class VideoCleanupJob {
  private readonly logger = new Logger(VideoCleanupJob.name);

  constructor(private readonly videoCleanupService: VideoCleanupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run() {
    try {
      await this.videoCleanupService.cleanupArchivedVideos();
    } catch (error) {
      this.logger.error('Không thể dọn video archive trên GCS.', error);
    }
  }
}
