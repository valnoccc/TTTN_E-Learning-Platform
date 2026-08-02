import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

jest.mock('uuid', () => ({ v4: () => 'certificate-id' }));

import { StudentCertificateService } from './student-certificate.service';

describe('StudentCertificateService', () => {
  let service: StudentCertificateService;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
    service = new StudentCertificateService(dataSource as unknown as DataSource);
  });

  it('rejects certification when not all lessons are completed', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ MaKH: 10 }])
      .mockResolvedValueOnce([{ totalLessons: 4, completedLessons: 3 }]);

    await expect(service.getOrIssueCertificate(7, 10)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects certification when a quiz chapter has no result above 70 percent', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ MaKH: 10 }])
      .mockResolvedValueOnce([{ totalLessons: 4, completedLessons: 4 }])
      .mockResolvedValueOnce([{ quizChapters: 2, passedQuizChapters: 1 }]);

    await expect(service.getOrIssueCertificate(7, 10)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('issues certification when lessons are complete and every quiz chapter exceeds 70 percent', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ MaKH: 10 }])
      .mockResolvedValueOnce([{ totalLessons: 4, completedLessons: 4 }])
      .mockResolvedValueOnce([{ quizChapters: 2, passedQuizChapters: 2 }])
      .mockResolvedValueOnce([]);

    const result = await service.getOrIssueCertificate(7, 10);

    expect(result.certificateId).toEqual(expect.any(String));
    expect(dataSource.query).toHaveBeenCalledTimes(5);
  });
});
