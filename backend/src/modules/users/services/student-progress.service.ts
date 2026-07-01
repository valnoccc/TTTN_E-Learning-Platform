import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentProgressService {
  constructor(private readonly dataSource: DataSource) {}

  async markLessonComplete(userId: number, lessonId: number) {
    const existing = await this.dataSource.query(
      `SELECT MaTienDo FROM TienDoHocTap WHERE MaND = ? AND MaBH = ?`,
      [userId, lessonId],
    );

    if (existing.length > 0) {
      await this.dataSource.query(
        `UPDATE TienDoHocTap SET DaHoanThanh = 1, LanXemCuoi = NOW() WHERE MaTienDo = ?`,
        [existing[0].MaTienDo],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO TienDoHocTap (MaND, MaBH, DaHoanThanh, LanXemCuoi) VALUES (?, ?, 1, NOW())`,
        [userId, lessonId],
      );
    }

    return { success: true };
  }

  async getMyProgress(userId: number) {
    const progress = await this.dataSource.query(
      `SELECT MaBH FROM TienDoHocTap WHERE MaND = ? AND DaHoanThanh = 1`,
      [userId],
    );
    return progress.map((p: any) => p.MaBH);
  }
}
