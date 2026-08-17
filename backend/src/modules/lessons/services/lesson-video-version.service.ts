import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface CreateVideoDraftInput {
  lessonId: number;
  objectName: string;
  videoUrl: string;
  gcsGeneration?: string | null;
  videoSourceType?: string;
  durationSeconds?: number;
  resolution?: number | null;
  aiStatus?: string | null;
  aiLabels?: string[] | null;
  aiRejectReason?: string | null;
}

@Injectable()
export class LessonVideoVersionService {
  constructor(private readonly dataSource: DataSource) {}

  async createDraft(input: CreateVideoDraftInput) {
    // Chỉ giữ một bản DRAFT đang chờ xử lý cho mỗi bài học. Các bản upload
    // trước đó không còn là phiên bản hiện hành và không được đưa vào hàng đợi AI.
    await this.dataSource.query(
      `UPDATE VideoBaiHoc
          SET TrangThai = 'ARCHIVED', NgayLuuTru = CURRENT_TIMESTAMP
        WHERE MaBH = ? AND TrangThai = 'DRAFT'`,
      [input.lessonId],
    );

    const result = await this.dataSource.query(
      `INSERT INTO VideoBaiHoc
       (MaBH, GcsObjectName, GcsGeneration, VideoURL, TrangThai, VideoSourceType,
        DurationSeconds, Resolution, AiStatus, AiLabels, AiRejectReason)
       VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?)`,
      [
        input.lessonId,
        input.objectName,
        input.gcsGeneration ?? null,
        input.videoUrl,
        input.videoSourceType ?? 'UPLOAD',
        input.durationSeconds ?? 0,
        input.resolution ?? null,
        input.aiStatus ?? null,
        input.aiLabels ? JSON.stringify(input.aiLabels) : null,
        input.aiRejectReason ?? null,
      ],
    );

    const insertId = Array.isArray(result)
      ? result[0]?.insertId
      : result?.insertId;
    return { id: Number(insertId ?? 0), status: 'DRAFT' as const };
  }

  async approveAppealedDraftVideos(courseId: number) {
    const result = await this.dataSource.query(
      `UPDATE VideoBaiHoc v
       INNER JOIN BaiHoc bh ON bh.MaBH = v.MaBH
          SET v.AiStatus = 'APPROVED', v.AiRejectReason = NULL
        WHERE bh.MaKH = ?
          AND v.TrangThai = 'DRAFT'
          AND v.AiStatus IN ('REJECTED', 'NEEDS_REVIEW')`,
      [courseId],
    );

    return { affectedRows: Number(result?.affectedRows ?? 0) };
  }

  async publishCourseVideos(courseId: number, adminId: number) {
    return this.dataSource.transaction(async (manager) => {
      const drafts = await manager.query(
        `SELECT v.MaVideo AS maVideo, v.MaBH AS maBH, v.VideoURL AS videoUrl,
                v.DurationSeconds AS durationSeconds, v.Resolution AS resolution,
                v.AiStatus AS aiStatus, v.AiLabels AS aiLabels
           FROM VideoBaiHoc v
           INNER JOIN BaiHoc bh ON bh.MaBH = v.MaBH
          WHERE bh.MaKH = ? AND v.TrangThai = 'DRAFT'
          ORDER BY v.MaVideo ASC`,
        [courseId],
      );

      const pending = drafts.filter(
        (draft: any) => String(draft.aiStatus ?? '').toUpperCase() !== 'APPROVED',
      );
      if (pending.length > 0) {
        throw new BadRequestException(
          'Không thể công bố vì vẫn còn video bản nháp chưa hoàn tất kiểm duyệt AI.',
        );
      }

      for (const draft of drafts) {
        const aiLabels = Array.isArray(draft.aiLabels)
          ? JSON.stringify(draft.aiLabels)
          : draft.aiLabels ?? null;

        await manager.query(
          `UPDATE VideoBaiHoc
              SET TrangThai = 'ARCHIVED', NgayLuuTru = CURRENT_TIMESTAMP
            WHERE MaBH = ? AND TrangThai = 'PUBLIC'`,
          [draft.maBH],
        );
        await manager.query(
          `UPDATE VideoBaiHoc
              SET TrangThai = 'PUBLIC', NgayCongBo = CURRENT_TIMESTAMP
            WHERE MaVideo = ? AND TrangThai = 'DRAFT'`,
          [draft.maVideo],
        );
        await manager.query(
          `UPDATE BaiHoc
              SET VideoURL = ?, DurationSeconds = ?, Resolution = ?,
                  AiStatus = 'APPROVED', AiLabels = ?, AiRejectReason = NULL
            WHERE MaBH = ?`,
          [
            draft.videoUrl,
            Number(draft.durationSeconds ?? 0),
            draft.resolution ?? null,
            aiLabels,
            draft.maBH,
          ],
        );
        await manager.query(
          `INSERT INTO LichSuPublicVideo (MaVideo, MaBH, MaAdmin, HanhDong, GhiChu)
           VALUES (?, ?, ?, 'PUBLISH', NULL)`,
          [draft.maVideo, draft.maBH, adminId],
        );
      }

      return { publishedCount: drafts.length };
    });
  }
}
