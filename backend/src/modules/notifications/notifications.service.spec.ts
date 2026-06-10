import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const notificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const service = new NotificationsService(notificationRepository as never);

  beforeEach(() => {
    notificationRepository.create.mockReset();
    notificationRepository.save.mockReset();
    notificationRepository.find.mockReset();
    notificationRepository.findOne.mockReset();
    notificationRepository.update.mockReset();
    notificationRepository.count.mockReset();
  });

  it('creates a notification with default unread state', async () => {
    notificationRepository.create.mockImplementation((value) => value);
    notificationRepository.save.mockImplementation((value) => Promise.resolve(value));

    await expect(
      service.createNotification({
        maND: 7,
        maNguoiGui: 99,
        loaiThongBao: 'COURSE',
        tieuDe: 'Khoa hoc bi tu choi xuat ban',
        noiDung: 'Can bo sung bai hoc',
      }),
    ).resolves.toEqual({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khoa hoc bi tu choi xuat ban',
      noiDung: 'Can bo sung bai hoc',
      daDoc: false,
    });
  });

  it('returns notifications for a user ordered by newest first', async () => {
    notificationRepository.find.mockResolvedValue([
      { maTB: 2, thoiGian: new Date('2026-06-10T10:00:00.000Z') },
      { maTB: 1, thoiGian: new Date('2026-06-10T11:00:00.000Z') },
    ]);

    await expect(service.getMyNotifications(7)).resolves.toEqual([
      { maTB: 1, thoiGian: new Date('2026-06-10T11:00:00.000Z') },
      { maTB: 2, thoiGian: new Date('2026-06-10T10:00:00.000Z') },
    ]);
  });

  it('marks a notification as read only if it belongs to the user', async () => {
    notificationRepository.findOne.mockResolvedValue({
      maTB: 11,
      maND: 7,
      daDoc: false,
    });
    notificationRepository.save.mockImplementation((value) => Promise.resolve(value));

    await expect(service.markAsRead(11, 7)).resolves.toEqual({
      maTB: 11,
      maND: 7,
      daDoc: true,
    });
  });

  it('rejects marking another user notification as read', async () => {
    notificationRepository.findOne.mockResolvedValue({
      maTB: 11,
      maND: 8,
      daDoc: false,
    });

    await expect(service.markAsRead(11, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
