import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { StudentQuizQuestionsService } from './student-quiz-questions.service';

describe('StudentQuizQuestionsService', () => {
  let service: StudentQuizQuestionsService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentQuizQuestionsService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(StudentQuizQuestionsService);
  });

  it('returns student-safe questions without the correct answer', async () => {
    dataSource.query.mockResolvedValue([
      { maCauHoi: 11, maChuong: 5, noiDung: 'HTML là gì?', dapAnDung: 'A' },
    ]);

    await expect(service.listForChapter(5)).resolves.toEqual([
      { maCauHoi: 11, maChuong: 5, noiDung: 'HTML là gì?' },
    ]);
    expect(dataSource.query.mock.calls[0][0]).not.toContain('DapAnDung');
  });
});
