import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: any, @Query('limit') limit?: string) {
    const data = await this.notificationsService.getMyNotifications(
      req.user.sub,
      limit ? Number(limit) : 50,
    );

    return {
      message: 'Lấy danh sách thông báo thành công.',
      data,
    };
  }

  @Get('unread-count')
  async countUnread(@Req() req: any) {
    return this.notificationsService.countUnread(req.user.sub);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(Number(id), req.user.sub);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }
}
