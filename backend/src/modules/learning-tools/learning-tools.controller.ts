import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LearningToolsService } from './learning-tools.service';
import { CreateLearningReminderDto } from './dto/create-learning-reminder.dto';

@Controller('learning-tools')
@UseGuards(JwtAuthGuard)
export class LearningToolsController {
  constructor(private readonly learningToolsService: LearningToolsService) {}

  @Post('reminders')
  async createReminder(@Req() req: any, @Body() dto: CreateLearningReminderDto) {
    const userId = req.user.sub || req.user.id || req.user.maND;
    const reminder = await this.learningToolsService.createReminder(userId, dto);
    return {
      message: 'Tạo nhắc nhở học tập thành công',
      data: reminder,
    };
  }

  @Get('reminders')
  async getReminders(@Req() req: any) {
    const userId = req.user.sub || req.user.id || req.user.maND;
    const reminders = await this.learningToolsService.getReminders(userId);
    return {
      message: 'Lấy danh sách nhắc nhở thành công',
      data: reminders,
    };
  }

  @Delete('reminders/:id')
  async deleteReminder(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.id || req.user.maND;
    await this.learningToolsService.deleteReminder(userId, +id);
    return {
      message: 'Đã xóa nhắc nhở',
    };
  }
}
