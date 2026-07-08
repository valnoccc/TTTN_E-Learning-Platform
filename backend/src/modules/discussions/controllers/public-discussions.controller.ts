import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { DiscussionsService } from '../services/discussions.service';

@Controller('public/courses')
export class PublicDiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  /**
   * GET /public/courses/:id/discussions
   * Tất cả mọi người đều xem được thảo luận (lọc sẵn IsHidden=FALSE, IsDeleted=FALSE trong service)
   */
  @Get(':id/discussions')
  async getPublicCourseDiscussions(@Param('id') id: string) {
    const discussions =
      await this.discussionsService.getPublicCourseDiscussions(Number(id));

    return {
      message: 'Lấy danh sách thảo luận thành công',
      data: discussions,
    };
  }

  /**
   * POST /public/courses/:id/discussions
   * Học viên đã đăng nhập đăng câu hỏi mới hoặc phản hồi
   */
  @Post(':id/discussions')
  @UseGuards(JwtAuthGuard)
  async createStudentDiscussion(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number; vaiTro: string } },
    @Body() body: { noiDung: string; parentId?: number },
  ) {
    const discussion = await this.discussionsService.createStudentDiscussion(
      Number(id),
      req.user.sub,
      body.noiDung,
      body.parentId,
    );

    return {
      message: 'Đăng câu hỏi thành công',
      data: discussion,
    };
  }

  /**
   * POST /public/courses/:id/discussions/:discussionId/toggle-like
   * Toggle like cho một bình luận
   */
  @Post(':id/discussions/:discussionId/toggle-like')
  @UseGuards(JwtAuthGuard)
  async toggleLikeDiscussion(
    @Param('id') id: string,
    @Param('discussionId') discussionId: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const result = await this.discussionsService.toggleLikeDiscussion(
      Number(discussionId),
      req.user.sub,
    );

    return {
      message: result.isLiked ? 'Đã thích' : 'Đã bỏ thích',
      data: result,
    };
  }

  /**
   * PATCH /public/courses/:id/discussions/:discussionId/hide
   * Ẩn bình luận (INSTRUCTOR của khóa học hoặc ADMIN)
   */
  @Patch(':id/discussions/:discussionId/hide')
  @UseGuards(JwtAuthGuard)
  async hideDiscussion(
    @Param('id') _id: string,
    @Param('discussionId') discussionId: string,
    @Req() req: Request & { user: { sub: number; vaiTro: string } },
  ) {
    const result = await this.discussionsService.hideDiscussion(
      Number(discussionId),
      req.user.sub,
      req.user.vaiTro,
    );

    return {
      message: 'Đã ẩn bình luận thành công',
      data: result,
    };
  }

  /**
   * DELETE /public/courses/:id/discussions/:discussionId
   * Xóa mềm bình luận theo phân quyền RBAC
   */
  @Delete(':id/discussions/:discussionId')
  @UseGuards(JwtAuthGuard)
  async deleteDiscussion(
    @Param('id') _id: string,
    @Param('discussionId') discussionId: string,
    @Req() req: Request & { user: { sub: number; vaiTro: string } },
  ) {
    const result = await this.discussionsService.deleteDiscussion(
      Number(discussionId),
      req.user.sub,
      req.user.vaiTro,
    );

    return {
      message: 'Đã xóa bình luận thành công',
      data: result,
    };
  }
}
