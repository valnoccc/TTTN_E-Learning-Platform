import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentProfileService {
  constructor(private readonly dataSource: DataSource) {}

  async getMyCourses(userId: number) {
    const courses = await this.dataSource.query(
      `SELECT 
        k.MaKH as id, 
        k.TenKhoaHoc as title, 
        k.HinhThuNho as image, 
        IFNULL(
          ROUND(
            (
              SELECT COUNT(*) 
              FROM TienDoHocTap t 
              JOIN BaiHoc b ON t.MaBH = b.MaBH 
              WHERE b.MaKH = k.MaKH AND t.MaND = d.MaND AND t.DaHoanThanh = 1
            ) * 100.0 / NULLIF((
              SELECT COUNT(*) 
              FROM BaiHoc b2 
              WHERE b2.MaKH = k.MaKH
            ), 0)
          , 0)
        , 0) as progress 
       FROM DangKyKhoaHoc d
       JOIN KhoaHoc k ON d.MaKH = k.MaKH
       WHERE d.MaND = ? AND d.TrangThai = 'ACTIVE'`,
      [userId],
    );
    return courses.map((c: any) => ({
      ...c,
      id: Number(c.id),
      progress: Number(c.progress),
    }));
  }

  async updateCurrentLesson(
    userId: number,
    courseId: number,
    lessonId: number,
  ) {
    console.log(
      `[updateCurrentLesson] userId=${userId} | courseId=${courseId} | lessonId=${lessonId}`,
    );
    await this.dataSource.query(
      `UPDATE DangKyKhoaHoc SET MaBaiHocGanNhat = ? WHERE MaND = ? AND MaKH = ? AND TrangThai = 'ACTIVE'`,
      [lessonId, userId, courseId],
    );
    return { success: true, lessonId };
  }

  async getCourseLastLesson(userId: number, courseId: number) {
    console.log(
      `[getCourseLastLesson] userId=${userId} | courseId=${courseId}`,
    );
    const rows = await this.dataSource.query(
      `SELECT MaBaiHocGanNhat as lastLessonId FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH = ? AND TrangThai = 'ACTIVE' LIMIT 1`,
      [userId, courseId],
    );
    if (rows.length === 0) return { lastLessonId: null };
    return {
      lastLessonId: rows[0].lastLessonId ? Number(rows[0].lastLessonId) : null,
    };
  }
}
