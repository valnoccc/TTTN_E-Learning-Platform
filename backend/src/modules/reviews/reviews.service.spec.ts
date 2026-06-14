import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { ReviewsService } from './services/reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let dataSource: {
    query: jest.Mock;
  };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(KhoaHoc), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('loads reviews for courses owned by the instructor', async () => {
    dataSource.query.mockResolvedValue([
      {
        reviewId: 1,
        courseId: 10,
        courseTitle: 'React',
      },
    ]);

    const result = await service.getInstructorReviews(99);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE kh.MaND_GiangVien = ?'),
      [99],
    );
    expect(result).toEqual([
      {
        reviewId: 1,
        courseId: 10,
        courseTitle: 'React',
      },
    ]);
  });
});
