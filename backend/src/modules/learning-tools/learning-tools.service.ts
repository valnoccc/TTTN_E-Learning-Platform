import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningReminder } from './entities/learning-reminder.entity';
import { CreateLearningReminderDto } from './dto/create-learning-reminder.dto';

@Injectable()
export class LearningToolsService {
  constructor(
    @InjectRepository(LearningReminder)
    private reminderRepository: Repository<LearningReminder>,
  ) {}

  async createReminder(userId: number, dto: CreateLearningReminderDto) {
    if (dto.tanSuat === 'HANG_TUAN' && !dto.cacThu) {
      throw new BadRequestException(
        'Vui lòng chọn các thứ trong tuần (cacThu)',
      );
    }
    if (dto.tanSuat === 'MOT_LAN' && !dto.ngayCuThe) {
      throw new BadRequestException('Vui lòng chọn ngày cụ thể (ngayCuThe)');
    }

    const reminder = this.reminderRepository.create({
      maND: userId,
      maKH: dto.courseId || undefined,
      tenNhacNho: dto.tenNhacNho || 'Nhắc nhở học tập',
      tanSuat: dto.tanSuat,
      thoiGian: dto.thoiGian,
      cacThu: dto.tanSuat === 'HANG_TUAN' ? dto.cacThu : undefined,
      ngayCuThe:
        dto.tanSuat === 'MOT_LAN' && dto.ngayCuThe
          ? new Date(dto.ngayCuThe)
          : undefined,
      trangThai: true,
    });

    return await this.reminderRepository.save(reminder);
  }

  async getReminders(userId: number) {
    return await this.reminderRepository.find({
      where: { maND: userId },
      order: { ngayTao: 'DESC' },
    });
  }

  async deleteReminder(userId: number, id: number) {
    const reminder = await this.reminderRepository.findOne({
      where: { maNN: id, maND: userId },
    });

    if (!reminder) {
      throw new BadRequestException('Không tìm thấy nhắc nhở này');
    }

    await this.reminderRepository.remove(reminder);
    return { success: true };
  }
}
