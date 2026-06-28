import {
  Body,
  Controller,
  Get,
  Param,
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
   * Học viên (và người dùng chưa đăng nhập) xem danh sách thảo luận
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
   * Học viên đã đăng nhập đăng câu hỏi mới
   */
  @Post(':id/discussions')
  @UseGuards(JwtAuthGuard)
  async createStudentDiscussion(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
    @Body() body: { noiDung: string },
  ) {
    const discussion = await this.discussionsService.createStudentDiscussion(
      Number(id),
      req.user.sub,
      body.noiDung,
    );

    return {
      message: 'Đăng câu hỏi thành công',
      data: discussion,
    };
  }
}
