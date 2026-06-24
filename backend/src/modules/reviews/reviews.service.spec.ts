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

  it('deletes only a review reply owned by the instructor on their course', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaDanhGia: 2 }])
      .mockResolvedValueOnce({ affectedRows: 1 });

    await expect(service.deleteOwnReview(2, 99)).resolves.toEqual({
      deleted: true,
    });

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('dg.MaDanhGia = ?'),
      [2, 99, 99],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM DanhGiaKhoaHoc'),
      [2],
    );
  });

  it('rejects deleting a review reply not owned by the instructor', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.deleteOwnReview(2, 99)).rejects.toThrow(
      'Bạn không có quyền xóa bình luận này',
    );
  });
});
