import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { QuizAttemptsService } from './services/quiz-attempts.service';

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
});
