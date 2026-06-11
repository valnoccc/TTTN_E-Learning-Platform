import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateReplyDto } from '../../courses/dto/create-reply.dto';
import { ReviewsService } from '../services/reviews.service';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  async getInstructorReviews(@Req() req: Request & { user: { sub: number } }) {
    const reviews = await this.reviewsService.getInstructorReviews(req.user.sub);

    return {
      message: 'Lấy danh sách đánh giá khóa học thành công',
      data: reviews,
    };
  }

  @Get(':id/reviews')
  async getCourseReviews(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const reviews = await this.reviewsService.getCourseReviews(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Lấy danh sách đánh giá thành công',
      data: reviews,
    };
  }

  @Post(':id/reviews')
  async replyToReview(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateReplyDto,
  ) {
    const replyData = await this.reviewsService.replyToReview(
      Number(id),
      req.user.sub,
      body,
    );

    return {
      message: 'Gửi phản hồi đánh giá thành công',
      data: replyData,
    };
  }
}
