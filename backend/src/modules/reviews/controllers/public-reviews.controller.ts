import { Controller, Get, Param } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';

@Controller('public/courses')
export class PublicReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/reviews')
  async getPublicCourseReviews(@Param('id') id: string) {
    const reviews = await this.reviewsService.getPublicCourseReviews(Number(id));
    return {
      message: 'Lấy danh sách đánh giá khóa học thành công',
      data: reviews,
    };
  }
}
