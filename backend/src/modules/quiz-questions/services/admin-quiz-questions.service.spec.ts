import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AdminQuizQuestionsService } from './admin-quiz-questions.service';

describe('AdminQuizQuestionsService', () => {
  let service: AdminQuizQuestionsService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuizQuestionsService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(AdminQuizQuestionsService);
  });

  it('lists every course question grouped by chapter for admin review', async () => {
    dataSource.query.mockResolvedValue([
      {
        maChuong: 5,
        tenChuong: 'HTML cơ bản',
        thuTuChuong: 1,
        maCauHoi: 11,
        noiDung: 'HTML là gì?',
        dapAnA: 'Ngôn ngữ đánh dấu',
        dapAnB: 'Cơ sở dữ liệu',
        dapAnC: 'Hệ điều hành',
        dapAnD: 'Trình duyệt',
        dapAnDung: 'A',
        thuTu: 1,
      },
    ]);

    await expect(service.listByCourse(99)).resolves.toEqual([
      expect.objectContaining({
        maChuong: 5,
        questions: [expect.objectContaining({ maCauHoi: 11 })],
      }),
    ]);
  });
});

