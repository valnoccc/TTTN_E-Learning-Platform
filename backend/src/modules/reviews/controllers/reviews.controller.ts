import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateReplyDto } from '../../courses/dto/create-reply.dto';
import { CreateStudentReviewDto } from '../dto/create-student-review.dto';
import { ReviewsService } from '../services/reviews.service';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR')
  async getInstructorReviews(@Req() req: Request & { user: { sub: number } }) {
    const reviews = await this.reviewsService.getInstructorReviews(req.user.sub);

    return {
      message: 'Lấy danh sách đánh giá khóa học thành công',
      data: reviews,
    };
  }

  @Get(':id/reviews')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR')
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
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR')
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

  @Delete('reviews/:reviewId')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR')
  async deleteOwnReview(
    @Param('reviewId') reviewId: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const result = await this.reviewsService.deleteOwnReview(
      Number(reviewId),
      req.user.sub,
    );

    return {
      message: 'Xóa phản hồi đánh giá thành công',
      data: result,
    };
  }

  @Post(':id/reviews/student')
  async createStudentReview(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateStudentReviewDto,
  ) {
    const reviewData = await this.reviewsService.createStudentReview(
      Number(id),
      req.user.sub,
      body,
    );

    return {
      message: 'Đánh giá khóa học thành công',
      data: reviewData,
    };
  }
}
