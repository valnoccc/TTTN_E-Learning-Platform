import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizQuestionChapterRecord } from './quiz-question.types';

@Injectable()
export class AdminQuizQuestionsService {
  constructor(private readonly dataSource: DataSource) {}

  async listByCourse(courseId: number): Promise<QuizQuestionChapterRecord[]> {
    const rows = await this.dataSource.query(
      `SELECT ch.MaChuong AS maChuong, ch.TenChuong AS tenChuong, ch.ThuTu AS thuTuChuong,
              q.MaCauHoi AS maCauHoi, q.NoiDung AS noiDung,
              q.DapAnA AS dapAnA, q.DapAnB AS dapAnB, q.DapAnC AS dapAnC, q.DapAnD AS dapAnD,
              q.DapAnDung AS dapAnDung, q.ThuTu AS thuTu
       FROM ChuongHoc ch LEFT JOIN CauHoiTracNghiem q ON q.MaChuong = ch.MaChuong
       WHERE ch.MaKH = ? ORDER BY ch.ThuTu ASC, q.ThuTu ASC, q.MaCauHoi ASC`, [courseId],
    );
    const chapters = new Map<number, QuizQuestionChapterRecord>();
    for (const row of rows) {
      const chapterId = Number(row.maChuong);
      const chapter: QuizQuestionChapterRecord = chapters.get(chapterId) ?? {
        maChuong: chapterId, tenChuong: row.tenChuong, thuTuChuong: Number(row.thuTuChuong), questions: [],
      };
      if (row.maCauHoi !== null && row.maCauHoi !== undefined) chapter.questions.push({
        maCauHoi: Number(row.maCauHoi), maChuong: chapterId, noiDung: row.noiDung,
        dapAnA: row.dapAnA, dapAnB: row.dapAnB, dapAnC: row.dapAnC, dapAnD: row.dapAnD,
        dapAnDung: row.dapAnDung, thuTu: Number(row.thuTu),
      });
      chapters.set(chapterId, chapter);
    }
    return Array.from(chapters.values());
  }
}
