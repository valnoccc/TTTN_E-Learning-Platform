import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { QuizAttemptsService } from './services/quiz-attempts.service';
import { randomizeQuizForAttempt } from './services/quiz-attempt-randomizer';

describe('QuizAttemptsService', () => {
  let service: QuizAttemptsService;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
    service = new QuizAttemptsService(dataSource as unknown as DataSource);
  });

  it('returns a new attempt without exposing the correct answer', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5, canAccess: 1 }])
      .mockResolvedValueOnce([{ totalLessons: 1, completedLessons: 1 }])
      .mockResolvedValueOnce([
        { maCauHoi: 11, maChuong: 5, noiDung: 'HTML là gì', dapAnA: 'A', dapAnB: 'B', dapAnC: 'C', dapAnD: 'D', dapAnDung: 'B', thuTu: 1 },
      ])
      .mockResolvedValueOnce([{ lanThu: 1 }])
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([]);

    const result = await service.startAttempt(7, 5);

    expect(result.attemptId).toBe(20);
    expect(result.questions[0]).not.toHaveProperty('dapAnDung');
    expect(result.questions[0]).toMatchObject({ maCauHoi: 11, noiDung: 'HTML là gì' });
    expect(result.questions[0].options).toEqual([
      { key: expect.stringMatching(/^[ABCD]$/), text: expect.any(String) },
      { key: expect.stringMatching(/^[ABCD]$/), text: expect.any(String) },
      { key: expect.stringMatching(/^[ABCD]$/), text: expect.any(String) },
      { key: expect.stringMatching(/^[ABCD]$/), text: expect.any(String) },
    ]);
    expect(new Set(result.questions[0].options.map((option: { key: string }) => option.key)).size).toBe(4);
  });

  it('uses a different stable order for different attempts', () => {
    const questions = Array.from({ length: 6 }, (_, index) => ({
      maCauHoi: index + 1,
      maChuong: 5,
      noiDung: `Câu ${index + 1}`,
      dapAnA: `A${index + 1}`,
      dapAnB: `B${index + 1}`,
      dapAnC: `C${index + 1}`,
      dapAnD: `D${index + 1}`,
      dapAnDung: 'A' as const,
      thuTu: index + 1,
    }));

    const firstAttempt = randomizeQuizForAttempt(questions, 20);
    const secondAttempt = randomizeQuizForAttempt(questions, 21);

    expect(firstAttempt.map((question) => question.maCauHoi)).not.toEqual(
      secondAttempt.map((question) => question.maCauHoi),
    );
    expect(firstAttempt[0].options.map((option) => option.key)).not.toEqual(
      secondAttempt[0].options.map((option) => option.key),
    );
  });

  it('keeps all questions and exposes options using their original answer keys', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5, canAccess: 1 }])
      .mockResolvedValueOnce([{ totalLessons: 0, completedLessons: 0 }])
      .mockResolvedValueOnce([
        { maCauHoi: 11, maChuong: 5, noiDung: 'Câu 1', dapAnA: 'A1', dapAnB: 'B1', dapAnC: 'C1', dapAnD: 'D1', dapAnDung: 'A', thuTu: 1 },
        { maCauHoi: 12, maChuong: 5, noiDung: 'Câu 2', dapAnA: 'A2', dapAnB: 'B2', dapAnC: 'C2', dapAnD: 'D2', dapAnDung: 'D', thuTu: 2 },
      ])
      .mockResolvedValueOnce([{ lanThu: 1 }])
      .mockResolvedValueOnce([{ insertId: 21 }])
      .mockResolvedValueOnce([]);

    const result = await service.startAttempt(7, 5);

    expect(result.questions).toHaveLength(2);
    for (const question of result.questions) {
      expect(question.options).toHaveLength(4);
      expect(question.options.map((option: { key: string }) => option.key).sort()).toEqual(['A', 'B', 'C', 'D']);
      expect(question).not.toHaveProperty('dapAnA');
      expect(question).not.toHaveProperty('dapAnDung');
    }
  });

  it('rejects starting an attempt before all chapter lessons are completed', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5, canAccess: 1 }])
      .mockResolvedValueOnce([{ totalLessons: 3, completedLessons: 2 }]);

    await expect(service.startAttempt(7, 5)).rejects.toThrow(
      'Bạn cần hoàn thành tất cả bài học trong chương trước khi làm bài kiểm tra',
    );
  });

  it('does not pass an attempt with exactly 50 percent correct', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaLichSu: 20, MaND: 7, MaChuong: 5, TongSoCau: 4, TrangThai: 'IN_PROGRESS' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ correctCount: 2 }])
      .mockResolvedValueOnce([]);

    const result = await service.submitAttempt(7, 20, [
      { maCauHoi: 11, dapAnChon: 'A' },
      { maCauHoi: 12, dapAnChon: 'B' },
    ]);

    expect(result.tyLeDung).toBe(50);
    expect(result.dat).toBe(false);
  });

  it('rejects starting an attempt when the previous chapter is not passed', async () => {
    dataSource.query.mockResolvedValueOnce([{ maChuong: 5, canAccess: 0 }]);

    await expect(service.startAttempt(7, 5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows access and reports no quiz when the chapter has no questions', async () => {
    dataSource.query.mockResolvedValueOnce([{
      maChuong: 6,
      previousChapterId: 5,
      canAccess: 1,
      hasQuiz: 0,
    }]);

    await expect(service.getChapterAccess(7, 6)).resolves.toMatchObject({
      chapterId: 6,
      canAccess: true,
      hasQuiz: false,
    });
  });
});
