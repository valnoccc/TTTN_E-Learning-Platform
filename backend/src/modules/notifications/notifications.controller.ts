import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async createNotification(
    @Req() req: any,
    @Body() body: { loaiThongBao?: string; tieuDe: string; noiDung: string },
  ) {
    const userId = req.user.sub;
    const loai =
      body.loaiThongBao &&
      Object.values(NotificationType).includes(body.loaiThongBao as NotificationType)
        ? (body.loaiThongBao as NotificationType)
        : NotificationType.SYSTEM;

    const notification = await this.notificationsService.createNotification({
      maND: userId,
      loaiThongBao: loai,
      tieuDe: body.tieuDe,
      noiDung: body.noiDung,
    });

    return { message: 'Tạo thông báo thành công.', data: notification };
  }

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
