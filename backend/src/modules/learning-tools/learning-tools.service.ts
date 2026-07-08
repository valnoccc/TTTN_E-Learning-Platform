import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { LearningReminder } from './entities/learning-reminder.entity';
import { CreateLearningReminderDto } from './dto/create-learning-reminder.dto';
import { SyncCalendarDto } from './dto/sync-calendar.dto';

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

  // ─────────────────────────────────────────────────────────────────────────
  // Chuyển đổi các thứ nội bộ (T2-CN) sang BYDAY chuẩn RFC 5545 của RRULE
  // ─────────────────────────────────────────────────────────────────────────
  private mapThuToRRuleDay(thu: string): string {
    const map: Record<string, string> = {
      CN: 'SU',
      T2: 'MO',
      T3: 'TU',
      T4: 'WE',
      T5: 'TH',
      T6: 'FR',
      T7: 'SA',
    };
    return map[thu] ?? thu; // Nếu đã là dạng MO,TU,... thì giữ nguyên
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Đồng bộ nhắc nhở học tập với Google Calendar API
  // ─────────────────────────────────────────────────────────────────────────
  async syncGoogleCalendar(dto: SyncCalendarDto) {
    const { accessToken, tenNhacNho, tanSuat, thoiGian, cacThu, ngayCuThe } =
      dto;
    const TIMEZONE = 'Asia/Ho_Chi_Minh';
    const GOOGLE_CALENDAR_API =
      'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    // ----- Tính toán ngày bắt đầu và kết thúc -----
    let startDateTime: string;
    let endDateTime: string;

    if (tanSuat === 'MOT_LAN' && ngayCuThe) {
      // Dùng ngày cụ thể người dùng chọn
      const [hour, minute] = thoiGian.split(':').map(Number);
      const start = new Date(`${ngayCuThe}T00:00:00`);
      start.setHours(hour, minute, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 giờ

      // Format theo ISO 8601 với offset +07:00 (không dùng UTC)
      const toVNString = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+07:00`;
      };
      startDateTime = toVNString(start);
      endDateTime = toVNString(end);
    } else {
      // Hàng ngày / Hàng tuần: bắt đầu từ ngày hôm nay theo giờ VN
      const now = new Date();
      // Chuyển sang giờ VN (+7)
      const vnOffset = 7 * 60;
      const localOffset = now.getTimezoneOffset(); // phút lệch của server (UTC = 0)
      const vnNow = new Date(now.getTime() + (vnOffset + localOffset) * 60000);

      const [hour, minute] = thoiGian.split(':').map(Number);
      vnNow.setHours(hour, minute, 0, 0);
      const vnEnd = new Date(vnNow.getTime() + 60 * 60 * 1000);

      const toVNString = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+07:00`;
      };
      startDateTime = toVNString(vnNow);
      endDateTime = toVNString(vnEnd);
    }

    // ----- Xây dựng RRULE theo tần suất -----
    let recurrence: string[] | undefined;

    if (tanSuat === 'HANG_NGAY') {
      recurrence = ['RRULE:FREQ=DAILY'];
    } else if (tanSuat === 'HANG_TUAN') {
      if (!cacThu) {
        throw new BadRequestException(
          'Vui lòng chọn các thứ trong tuần (cacThu)',
        );
      }
      // Chuyển đổi "T2,T4,T6" → "MO,WE,FR"
      const byDay = cacThu
        .split(',')
        .map((t) => this.mapThuToRRuleDay(t.trim()))
        .join(',');
      recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];
    }
    // tanSuat === 'MOT_LAN': không thêm recurrence

    // ----- Cấu trúc Event body gửi lên Google Calendar -----
    const eventBody: Record<string, any> = {
      summary: `Lịch học Edumeo: ${tenNhacNho}`,
      description:
        'Lịch nhắc học tập định kỳ được đồng bộ tự động từ hệ thống Edumeo.',
      start: {
        dateTime: startDateTime,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: TIMEZONE,
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 10 }],
      },
    };

    if (recurrence) {
      eventBody.recurrence = recurrence;
    }

    // ----- Gửi request lên Google Calendar API -----
    try {
      const response = await axios.post(GOOGLE_CALENDAR_API, eventBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return {
        googleEventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      throw new BadRequestException(
        `Không thể đồng bộ với Google Calendar: ${errMsg}`,
      );
    }
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
