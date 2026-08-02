import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CreateQuizQuestionDto } from '../dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from '../dto/update-quiz-question.dto';
import { QuizAnswerKey } from '../entities/quiz-question.entity';

interface QuizQuestionRecord {
  maCauHoi: number;
  maChuong: number;
  noiDung: string;
  dapAnA: string;
  dapAnB: string;
  dapAnC: string;
  dapAnD: string;
  dapAnDung: QuizAnswerKey;
  thuTu: number;
}

@Injectable()
export class QuizQuestionsService {
  constructor(private readonly dataSource: DataSource) {}

  async listByChapter(chapterId: number, instructorId: number) {
    await this.ensureOwnedChapter(chapterId, instructorId);

    return this.dataSource.query(
      `SELECT MaCauHoi AS maCauHoi, MaChuong AS maChuong, NoiDung AS noiDung,
              DapAnA AS dapAnA, DapAnB AS dapAnB, DapAnC AS dapAnC, DapAnD AS dapAnD,
              DapAnDung AS dapAnDung, ThuTu AS thuTu
       FROM CauHoiTracNghiem
       WHERE MaChuong = ?
       ORDER BY ThuTu ASC, MaCauHoi ASC`,
      [chapterId],
    );
  }

  async create(
    chapterId: number,
    instructorId: number,
    payload: CreateQuizQuestionDto,
  ) {
    await this.ensureOwnedChapter(chapterId, instructorId);
    const normalized = this.normalizePayload(payload);

    const result = await this.dataSource.query(
      `INSERT INTO CauHoiTracNghiem
       (MaChuong, NoiDung, DapAnA, DapAnB, DapAnC, DapAnD, DapAnDung, ThuTu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chapterId,
        normalized.noiDung,
        normalized.dapAnA,
        normalized.dapAnB,
        normalized.dapAnC,
        normalized.dapAnD,
        normalized.dapAnDung,
        normalized.thuTu,
      ],
    );

    return {
      maCauHoi: Number(result.insertId ?? result[0]?.maCauHoi),
      maChuong: chapterId,
      ...normalized,
    };
  }

  async update(
    chapterId: number,
    questionId: number,
    instructorId: number,
    payload: UpdateQuizQuestionDto,
  ) {
    await this.ensureOwnedChapter(chapterId, instructorId);
    const question = await this.findQuestion(chapterId, questionId);
    const normalized = this.normalizePayload({ ...question, ...payload });

    await this.dataSource.query(
      `UPDATE CauHoiTracNghiem
       SET NoiDung = ?, DapAnA = ?, DapAnB = ?, DapAnC = ?, DapAnD = ?, DapAnDung = ?, ThuTu = ?
       WHERE MaCauHoi = ? AND MaChuong = ?`,
      [
        normalized.noiDung,
        normalized.dapAnA,
        normalized.dapAnB,
        normalized.dapAnC,
        normalized.dapAnD,
        normalized.dapAnDung,
        normalized.thuTu,
        questionId,
        chapterId,
      ],
    );

    return { maCauHoi: questionId, maChuong: chapterId, ...normalized };
  }

  async remove(chapterId: number, questionId: number, instructorId: number) {
    await this.ensureOwnedChapter(chapterId, instructorId);
    await this.findQuestion(chapterId, questionId);

    await this.dataSource.query(
      `DELETE FROM CauHoiTracNghiem WHERE MaCauHoi = ? AND MaChuong = ?`,
      [questionId, chapterId],
    );
  }

  private async ensureOwnedChapter(chapterId: number, instructorId: number) {
    const chapters = await this.dataSource.query(
      `SELECT ch.MaChuong AS maChuong
       FROM ChuongHoc ch
       INNER JOIN KhoaHoc kh ON kh.MaKH = ch.MaKH
       WHERE ch.MaChuong = ? AND kh.MaND_GiangVien = ?
       LIMIT 1`,
      [chapterId, instructorId],
    );

    if (chapters.length === 0) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác câu hỏi của chương này',
      );
    }
  }

  private async findQuestion(chapterId: number, questionId: number) {
    const questions = await this.dataSource.query(
      `SELECT MaCauHoi AS maCauHoi, MaChuong AS maChuong, NoiDung AS noiDung,
              DapAnA AS dapAnA, DapAnB AS dapAnB, DapAnC AS dapAnC, DapAnD AS dapAnD,
              DapAnDung AS dapAnDung, ThuTu AS thuTu
       FROM CauHoiTracNghiem
       WHERE MaCauHoi = ? AND MaChuong = ?
       LIMIT 1`,
      [questionId, chapterId],
    );

    if (questions.length === 0) {
      throw new NotFoundException('Không tìm thấy câu hỏi trong chương này');
    }

    return questions[0] as QuizQuestionRecord;
  }

  private normalizePayload(
    payload: Pick<
      QuizQuestionRecord,
      | 'noiDung'
      | 'dapAnA'
      | 'dapAnB'
      | 'dapAnC'
      | 'dapAnD'
      | 'dapAnDung'
      | 'thuTu'
    >,
  ): Omit<QuizQuestionRecord, 'maCauHoi' | 'maChuong'> {
    const textFields = [
      'noiDung',
      'dapAnA',
      'dapAnB',
      'dapAnC',
      'dapAnD',
    ] as const;
    for (const field of textFields) {
      if (typeof payload[field] !== 'string' || !payload[field].trim()) {
        throw new BadRequestException(`${field} không được để trống`);
      }
    }

    if (
      !Object.values(QuizAnswerKey).includes(payload.dapAnDung as QuizAnswerKey)
    ) {
      throw new BadRequestException('dapAnDung phải là A, B, C hoặc D');
    }

    if (!Number.isInteger(payload.thuTu) || payload.thuTu < 1) {
      throw new BadRequestException('thuTu phải là số nguyên dương');
    }

    return {
      noiDung: payload.noiDung.trim(),
      dapAnA: payload.dapAnA.trim(),
      dapAnB: payload.dapAnB.trim(),
      dapAnC: payload.dapAnC.trim(),
      dapAnD: payload.dapAnD.trim(),
      dapAnDung: payload.dapAnDung as QuizAnswerKey,
      thuTu: payload.thuTu,
    };
  }
}
