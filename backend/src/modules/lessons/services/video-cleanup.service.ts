import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';

export interface VideoCleanupResult {
  scanned: number;
  deleted: number;
  failed: number;
}

@Injectable()
export class VideoCleanupService {
  private readonly logger = new Logger(VideoCleanupService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly videoStorage: LessonVideoStorageService,
  ) {}

  async cleanupArchivedVideos(now = new Date()): Promise<VideoCleanupResult> {
    const retentionDays = this.getRetentionDays();
    const candidates = await this.dataSource.query(
      `SELECT v.MaVideo AS maVideo, v.VideoURL AS videoUrl
         FROM VideoBaiHoc v
        WHERE v.TrangThai = 'ARCHIVED'
          AND v.NgayLuuTru IS NOT NULL
          AND v.NgayLuuTru < DATE_SUB(?, INTERVAL ${retentionDays} DAY)
          AND v.VideoURL IS NOT NULL
          AND v.VideoURL <> ''
          AND NOT EXISTS (
            SELECT 1
              FROM BaiHoc bh
             WHERE bh.MaBH = v.MaBH
               AND bh.VideoURL = v.VideoURL
          )
          AND NOT EXISTS (
            SELECT 1
              FROM VideoBaiHoc activeVersion
             WHERE activeVersion.MaVideo <> v.MaVideo
               AND activeVersion.TrangThai IN ('DRAFT', 'PUBLIC')
               AND activeVersion.GcsObjectName = v.GcsObjectName
          )
        ORDER BY v.MaVideo ASC`,
      [now],
    );

    let deleted = 0;
    let failed = 0;

    for (const candidate of candidates as Array<{
      maVideo: number;
      videoUrl: string;
    }>) {
      const removedFromStorage = await this.videoStorage.deleteVideo(
        candidate.videoUrl,
      );

      if (!removedFromStorage) {
        failed += 1;
        continue;
      }

      await this.dataSource.query(
        `DELETE FROM LichSuPublicVideo WHERE MaVideo = ?`,
        [candidate.maVideo],
      );
      await this.dataSource.query(
        `DELETE FROM VideoBaiHoc WHERE MaVideo = ? AND TrangThai = 'ARCHIVED'`,
        [candidate.maVideo],
      );
      deleted += 1;
    }

    if (candidates.length > 0) {
      this.logger.log(
        `Video cleanup: scanned=${candidates.length}, deleted=${deleted}, failed=${failed}, retentionDays=${retentionDays}`,
      );
    }

    return { scanned: candidates.length, deleted, failed };
  }

  private getRetentionDays(): number {
    const configuredDays = Number(process.env.VIDEO_ARCHIVE_RETENTION_DAYS ?? 90);
    return Number.isInteger(configuredDays) && configuredDays > 0
      ? configuredDays
      : 90;
  }
}
