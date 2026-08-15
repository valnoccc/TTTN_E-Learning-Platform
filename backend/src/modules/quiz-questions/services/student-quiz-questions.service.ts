import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizQuestionRecord } from './quiz-question.types';

export type StudentQuizQuestion = Omit<QuizQuestionRecord, 'dapAnDung'>;

@Injectable()
export class StudentQuizQuestionsService {
  constructor(private readonly dataSource: DataSource) {}

  async listForAttempt(chapterId: number): Promise<QuizQuestionRecord[]> {
    return this.dataSource.query(
      `SELECT MaCauHoi AS maCauHoi, MaChuong AS maChuong, NoiDung AS noiDung,
          DapAnA AS dapAnA, DapAnB AS dapAnB, DapAnC AS dapAnC, DapAnD AS dapAnD,
          ThuTu AS thuTu, DapAnDung AS dapAnDung
       FROM CauHoiTracNghiem WHERE MaChuong = ? ORDER BY ThuTu ASC, MaCauHoi ASC`, [chapterId],
    ) as Promise<QuizQuestionRecord[]>;
  }

  async listForChapter(chapterId: number): Promise<StudentQuizQuestion[]> {
    const questions = await this.dataSource.query(
      `SELECT MaCauHoi AS maCauHoi, MaChuong AS maChuong, NoiDung AS noiDung,
          DapAnA AS dapAnA, DapAnB AS dapAnB, DapAnC AS dapAnC, DapAnD AS dapAnD,
          ThuTu AS thuTu
       FROM CauHoiTracNghiem WHERE MaChuong = ? ORDER BY ThuTu ASC, MaCauHoi ASC`,
      [chapterId],
    ) as Array<StudentQuizQuestion & { dapAnDung?: unknown }>;
    return questions.map(({ dapAnDung: _dapAnDung, ...question }) => question);
  }
}
