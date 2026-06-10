import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType, ThongBao } from './entities/notification.entity';

export interface CreateNotificationInput {
  maND: number;
  maNguoiGui?: number | null;
  loaiThongBao: NotificationType;
  tieuDe: string;
  noiDung: string;
  daDoc?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(ThongBao)
    private readonly notificationRepository: Repository<ThongBao>,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    const notification = this.notificationRepository.create({
      ...input,
      maNguoiGui: input.maNguoiGui ?? null,
      daDoc: input.daDoc ?? false,
    });

    return this.notificationRepository.save(notification);
  }

  async getMyNotifications(userId: number, limit = 50) {
    const notifications = await this.notificationRepository.find({
      where: { maND: userId },
      take: limit,
    });

    return [...notifications].sort((left, right) => {
      const leftTime = new Date(left.thoiGian ?? 0).getTime();
      const rightTime = new Date(right.thoiGian ?? 0).getTime();
      return rightTime - leftTime;
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { maTB: notificationId, maND: userId },
    });

    if (!notification || notification.maND !== userId) {
      throw new NotFoundException('Khong tim thay thong bao.');
    }

    notification.daDoc = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { maND: userId, daDoc: false },
      { daDoc: true },
    );

    return {
      message: 'Da danh dau tat ca thong bao la da doc.',
    };
  }

  async countUnread(userId: number) {
    const count = await this.notificationRepository.count({
      where: { maND: userId, daDoc: false },
    });

    return {
      unreadCount: count,
    };
  }
}
