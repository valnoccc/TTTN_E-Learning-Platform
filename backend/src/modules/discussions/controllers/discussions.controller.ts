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

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateDiscussionReplyDto } from '../dto/create-discussion-reply.dto';
import { DiscussionsService } from '../services/discussions.service';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get('discussions')
  async getInstructorDiscussions(
    @Req() req: Request & { user: { sub: number } },
  ) {
    const discussions = await this.discussionsService.getInstructorDiscussions(
      req.user.sub,
    );

    return {
      message: 'Lấy danh sách hỏi đáp khóa học thành công',
      data: discussions,
    };
  }

  @Get(':id/discussions')
  async getCourseDiscussions(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const discussions = await this.discussionsService.getCourseDiscussions(
      Number(id),
      req.user.sub,
    );

    return {
      message: 'Lấy danh sách thảo luận khóa học thành công',
      data: discussions,
    };
  }

  @Post(':id/discussions')
  async replyToDiscussion(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateDiscussionReplyDto,
  ) {
    const replyData = await this.discussionsService.replyToDiscussion(
      Number(id),
      req.user.sub,
      body,
    );

    return {
      message: 'Gửi phản hồi thảo luận thành công',
      data: replyData,
    };
  }

  @Delete('discussions/:discussionId')
  async deleteOwnDiscussion(
    @Param('discussionId') discussionId: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const result = await this.discussionsService.deleteOwnDiscussion(
      Number(discussionId),
      req.user.sub,
    );

    return {
      message: 'Xóa bình luận hỏi đáp thành công',
      data: result,
    };
  }

  @Patch('discussions/:discussionId/reject-reports')
  async rejectDiscussionReports(
    @Param('discussionId') discussionId: string,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const result = await this.discussionsService.rejectDiscussionReports(
      Number(discussionId),
      req.user.sub,
    );

    return {
      message: 'Bỏ qua báo cáo thành công',
      data: result,
    };
  }
}
