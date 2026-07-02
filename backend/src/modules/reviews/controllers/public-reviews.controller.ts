import { Controller, Get, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('public/courses')
export class PublicReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/reviews')
  async getPublicCourseReviews(
    @Param('id') id: string,
    @Query('tuKhoa') tuKhoa?: string,
    @Query('soSao') soSao?: string,
    @Query('userId') userId?: string,
  ) {
    const reviews = await this.reviewsService.getPublicCourseReviews(
      Number(id),
      tuKhoa,
      soSao ? Number(soSao) : undefined,
      userId ? Number(userId) : undefined,
    );
    return {
      message: 'Lấy danh sách đánh giá khóa học thành công',
      data: reviews,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews/:reviewId/vote')
  async voteReview(
    @Param('id') courseId: string,
    @Param('reviewId') reviewId: string,
    @Body('trangThai') trangThai: number,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.maND || req.user.id;
    const result = await this.reviewsService.voteReview(Number(reviewId), Number(userId), trangThai);
    return { message: 'Đã lưu bình chọn', data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews/:reviewId/report')
  async reportReview(
    @Param('id') courseId: string,
    @Param('reviewId') reviewId: string,
    @Body('lyDo') lyDo: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.maND || req.user.id;
    const result = await this.reviewsService.reportReview(Number(reviewId), Number(userId), lyDo);
    return { message: 'Đã gửi báo cáo vi phạm', data: result };
  }
}
