import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let reviewsService: {
    getInstructorReviews: jest.Mock;
    deleteOwnReview: jest.Mock;
  };

  beforeEach(async () => {
    reviewsService = {
      getInstructorReviews: jest.fn(),
      deleteOwnReview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: ReviewsService, useValue: reviewsService },
        { provide: getRepositoryToken(KhoaHoc), useValue: {} },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns instructor reviews for the summary page', async () => {
    reviewsService.getInstructorReviews.mockResolvedValue([
      { reviewId: 1, courseId: 10, courseTitle: 'React' },
    ]);

    const result = await controller.getInstructorReviews({
      user: { sub: 77 },
    } as never);

    expect(reviewsService.getInstructorReviews).toHaveBeenCalledWith(77);
    expect(result.data).toEqual([
      { reviewId: 1, courseId: 10, courseTitle: 'React' },
    ]);
  });

  it('deletes an instructor owned review reply', async () => {
    reviewsService.deleteOwnReview.mockResolvedValue({ deleted: true });

    const result = await controller.deleteOwnReview('2', {
      user: { sub: 77 },
    } as never);

    expect(reviewsService.deleteOwnReview).toHaveBeenCalledWith(2, 77);
    expect(result).toEqual({
      message: 'Xóa phản hồi đánh giá thành công',
      data: { deleted: true },
    });
  });
});
