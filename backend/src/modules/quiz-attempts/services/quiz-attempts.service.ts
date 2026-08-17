import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizAnswerDto } from '../dto/submit-quiz-attempt.dto';
import { StudentQuizQuestionsService } from '../../quiz-questions/services/student-quiz-questions.service';
import { randomizeQuizForAttempt } from './quiz-attempt-randomizer';

@Injectable()
export class QuizAttemptsService {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly injectedStudentQuizQuestionsService?: StudentQuizQuestionsService,
  ) {
    this.studentQuizQuestionsService = injectedStudentQuizQuestionsService ?? new StudentQuizQuestionsService(dataSource);
  }

  private readonly studentQuizQuestionsService: StudentQuizQuestionsService;

  async startAttempt(studentId: number, chapterId: number) {
    const accessRows = await this.dataSource.query(
      `SELECT t.maChuong,
          CASE
            WHEN t.previousChapterId IS NULL THEN 1
            WHEN NOT EXISTS (
              SELECT 1 FROM CauHoiTracNghiem previousQuiz
              WHERE previousQuiz.MaChuong = t.previousChapterId
            ) THEN 1
            WHEN EXISTS (
              SELECT 1 FROM LichSuLamBai passed
              WHERE passed.MaND = ? AND passed.MaChuong = t.previousChapterId
                AND passed.Dat = 1 AND passed.TrangThai = 'SUBMITTED'
            ) THEN 1 ELSE 0
          END AS canAccess
       FROM (
         SELECT ch.MaChuong AS maChuong,
           (
             SELECT beforeChapter.MaChuong
             FROM ChuongHoc beforeChapter
             WHERE beforeChapter.MaKH = ch.MaKH AND beforeChapter.ThuTu < ch.ThuTu
             ORDER BY beforeChapter.ThuTu DESC LIMIT 1
           ) AS previousChapterId
         FROM ChuongHoc ch
         INNER JOIN KhoaHoc kh ON kh.MaKH = ch.MaKH
         INNER JOIN DangKyKhoaHoc dk ON dk.MaKH = kh.MaKH
         WHERE ch.MaChuong = ? AND dk.MaND = ? AND dk.TrangThai = 'ACTIVE'
         LIMIT 1
       ) t`,
      [studentId, chapterId, studentId],
    );

    if (accessRows.length === 0) {
      throw new NotFoundException('Không tìm thấy chương hoặc quyền truy cập');
    }
    if (Number(accessRows[0].canAccess) !== 1) {
      throw new BadRequestException('Bạn chưa vượt qua bài kiểm tra của chương trước');
    }

    const lessonProgressRows = await this.dataSource.query(
      `SELECT COUNT(bh.MaBH) AS totalLessons,
          COUNT(CASE WHEN td.DaHoanThanh = 1 THEN 1 END) AS completedLessons
       FROM BaiHoc bh
       LEFT JOIN TienDoHocTap td ON td.MaBH = bh.MaBH AND td.MaND = ?
       WHERE bh.MaChuong = ? AND bh.TrangThai = 'ACTIVE'`,
      [studentId, chapterId],
    );
    const totalLessons = Number(lessonProgressRows[0]?.totalLessons ?? 0);
    const completedLessons = Number(lessonProgressRows[0]?.completedLessons ?? 0);
    if (totalLessons > 0 && completedLessons < totalLessons) {
      throw new BadRequestException(
        'Bạn cần hoàn thành tất cả bài học trong chương trước khi làm bài kiểm tra',
      );
    }

    const questions = await this.studentQuizQuestionsService.listForAttempt(chapterId);

      if (questions.length === 0) {
        throw new BadRequestException('Chương chưa có câu hỏi kiểm tra');
      }

      const attemptRows = await this.dataSource.query(
        `SELECT COALESCE(MAX(LanThu), 0) + 1 AS lanThu
         FROM LichSuLamBai WHERE MaND = ? AND MaChuong = ?`,
        [studentId, chapterId],
      );
      const lanThu = Number(attemptRows[0]?.lanThu ?? 1);
      const insertResult = await this.dataSource.query(
        `INSERT INTO LichSuLamBai (MaND, MaChuong, LanThu, TongSoCau)
         VALUES (?, ?, ?, ?)`,
        [studentId, chapterId, lanThu, questions.length],
      );
      const attemptId = Number(insertResult.insertId ?? insertResult[0]?.insertId);
      const placeholders = questions.map(() => '(?, ?, NULL, ?, 0)').join(', ');
      const detailParams = questions.flatMap((question) => [
        attemptId,
        question.maCauHoi,
        question.dapAnDung,
      ]);
      await this.dataSource.query(
        `INSERT INTO ChiTietLichSuLamBai (MaLichSu, MaCauHoi, DapAnChon, DapAnDung, Dung)
         VALUES ${placeholders}`,
        detailParams,
      );

    return {
      attemptId,
      chapterId,
      lanThu,
      totalQuestions: questions.length,
      questions: randomizeQuizForAttempt(questions, attemptId),
    };
  }

  async submitAttempt(studentId: number, attemptId: number, answers: QuizAnswerDto[]) {
    const attempts = await this.dataSource.query(
      `SELECT MaLichSu, MaChuong, TongSoCau, TrangThai
       FROM LichSuLamBai WHERE MaLichSu = ? AND MaND = ? LIMIT 1`,
      [attemptId, studentId],
    );
    if (attempts.length === 0) throw new NotFoundException('Không tìm thấy lần làm bài');
    const attempt = attempts[0];
    if (attempt.TrangThai !== 'IN_PROGRESS') {
      throw new BadRequestException('Lần làm bài này đã được nộp');
    }

    for (const answer of answers) {
      await this.dataSource.query(
        `UPDATE ChiTietLichSuLamBai
         SET DapAnChon = ?, Dung = IF(DapAnDung = ?, 1, 0)
         WHERE MaLichSu = ? AND MaCauHoi = ?`,
        [answer.dapAnChon ?? null, answer.dapAnChon ?? null, attemptId, answer.maCauHoi],
      );
    }

    const correctRows = await this.dataSource.query(
      `SELECT COUNT(*) AS correctCount
       FROM ChiTietLichSuLamBai WHERE MaLichSu = ? AND Dung = 1`,
      [attemptId],
    );
    const soCauDung = Number(correctRows[0]?.correctCount ?? 0);
    const tongSoCau = Number(attempt.TongSoCau);
    const tyLeDung = tongSoCau > 0 ? Number(((soCauDung * 100) / tongSoCau).toFixed(2)) : 0;
    const dat = soCauDung * 100 > tongSoCau * 50;

    await this.dataSource.query(
      `UPDATE LichSuLamBai
       SET SoCauDung = ?, TyLeDung = ?, Dat = ?, TrangThai = 'SUBMITTED', NopLuc = NOW()
       WHERE MaLichSu = ? AND MaND = ?`,
      [soCauDung, tyLeDung, dat ? 1 : 0, attemptId, studentId],
    );

    return { attemptId, chapterId: Number(attempt.MaChuong), tongSoCau, soCauDung, tyLeDung, dat };
  }

  async getHistory(studentId: number, chapterId: number) {
    return this.dataSource.query(
      `SELECT MaLichSu AS maLichSu, MaChuong AS maChuong, LanThu AS lanThu,
          TongSoCau AS tongSoCau, SoCauDung AS soCauDung, TyLeDung AS tyLeDung,
          Dat AS dat, TrangThai AS trangThai, BatDauLuc AS batDauLuc, NopLuc AS nopLuc
       FROM LichSuLamBai WHERE MaND = ? AND MaChuong = ?
       ORDER BY LanThu DESC`,
      [studentId, chapterId],
    );
  }

  async getChapterAccess(studentId: number, chapterId: number) {
    const rows = await this.dataSource.query(
        `SELECT t.maChuong,
            t.previousChapterId,
            CASE WHEN t.previousChapterId IS NULL OR NOT EXISTS (
              SELECT 1 FROM CauHoiTracNghiem previousChapterQuestion
              WHERE previousChapterQuestion.MaChuong = t.previousChapterId
            ) OR EXISTS (
              SELECT 1 FROM LichSuLamBai passed
              WHERE passed.MaND = ? AND passed.MaChuong = t.previousChapterId
                AND passed.Dat = 1 AND passed.TrangThai = 'SUBMITTED'
            ) THEN 1 ELSE 0 END AS canAccess,
            CASE WHEN EXISTS (
              SELECT 1 FROM LichSuLamBai currentChapterPassed
              WHERE currentChapterPassed.MaND = ? AND currentChapterPassed.MaChuong = t.maChuong
                AND currentChapterPassed.Dat = 1 AND currentChapterPassed.TrangThai = 'SUBMITTED'
            ) THEN 1 ELSE 0 END AS quizPassed,
            CASE WHEN EXISTS (
              SELECT 1 FROM CauHoiTracNghiem currentChapterQuestion
              WHERE currentChapterQuestion.MaChuong = t.maChuong
            ) THEN 1 ELSE 0 END AS hasQuiz
         FROM (
           SELECT ch.MaChuong AS maChuong,
             (
               SELECT beforeChapter.MaChuong FROM ChuongHoc beforeChapter
               WHERE beforeChapter.MaKH = ch.MaKH AND beforeChapter.ThuTu < ch.ThuTu
               ORDER BY beforeChapter.ThuTu DESC LIMIT 1
             ) AS previousChapterId
           FROM ChuongHoc ch
           INNER JOIN KhoaHoc kh ON kh.MaKH = ch.MaKH
           INNER JOIN DangKyKhoaHoc dk ON dk.MaKH = kh.MaKH
           WHERE ch.MaChuong = ? AND dk.MaND = ? AND dk.TrangThai = 'ACTIVE' LIMIT 1
         ) t`,
        [studentId, studentId, chapterId, studentId],
      );
    if (rows.length === 0) throw new NotFoundException('Không tìm thấy chương');

    return {
      chapterId: Number(rows[0].maChuong),
      previousChapterId: rows[0].previousChapterId ? Number(rows[0].previousChapterId) : null,
      canAccess: Number(rows[0].canAccess) === 1,
      quizPassed: Number(rows[0].quizPassed) === 1,
      hasQuiz: Number(rows[0].hasQuiz) === 1,
    };
  }
}
