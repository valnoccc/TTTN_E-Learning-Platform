jest.mock('../../lesson-video-storage/lesson-video-storage.service', () => ({
  LessonVideoStorageService: class LessonVideoStorageService {},
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseAdminService } from './course-admin.service';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';

describe('CourseAdminService', () => {
  const resolveValue = <T>(value: T) => Promise.resolve(value);

  const dataSource = {
    query: jest.fn(),
  };

  const courseRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const notificationsService = {
    createNotification: jest.fn(),
  };

  const lessonVideoStorageService = {
    getPlayableUrl: jest.fn(async (url) => url),
  };

  const moderationHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const service = new CourseAdminService(
    courseRepository as never,
    moderationHistoryRepository as never,
    notificationsService as never,
    dataSource as never,
    lessonVideoStorageService as never,
  );

  beforeEach(() => {
    dataSource.query.mockReset();
    courseRepository.findOne.mockReset();
    courseRepository.save.mockReset();
    moderationHistoryRepository.create.mockReset();
    moderationHistoryRepository.save.mockReset();
    notificationsService.createNotification.mockReset();
  });

  it('returns admin course management rows', async () => {
    dataSource.query.mockResolvedValue([
      {
        id: 11,
        tenKhoaHoc: 'React Co Ban',
        giaBan: '399000',
        trangThai: 'PENDING',
        hinhThuNho: 'https://example.com/course.png',
        moTa: 'Mo ta',
        ngayCapNhat: '2026-06-10T09:00:00.000Z',
        instructorId: 7,
        instructorName: 'Tran Van B',
        instructorEmail: 'b@example.com',
        instructorAvatar: 'https://example.com/avatar.png',
        categoryName: 'Frontend',
        lessonCount: '12',
        orderCount: '20',
      },
    ]);

    await expect(
      service.getCourses({ status: 'PENDING', search: 'react' }),
    ).resolves.toEqual([
      {
        id: 11,
        tenKhoaHoc: 'React Co Ban',
        giaBan: 399000,
        trangThai: 'PENDING',
        hinhThuNho: 'https://example.com/course.png',
        moTa: 'Mo ta',
        ngayCapNhat: '2026-06-10T09:00:00.000Z',
        instructorId: 7,
        instructorName: 'Tran Van B',
        instructorEmail: 'b@example.com',
        instructorAvatar: 'https://example.com/avatar.png',
        categoryName: 'Frontend',
        lessonCount: 12,
        orderCount: 20,
      },
    ]);
  });

  it('returns course detail with goals requirements curriculum reviews and moderation history', async () => {
    courseRepository.findOne.mockResolvedValue({
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      moTa: 'Mo ta',
      giaBan: 399000,
      trangThai: 'PENDING',
      hinhThuNho: 'https://example.com/course.png',
      ngayCapNhat: '2026-06-10T09:00:00.000Z',
      maDM: 4,
      maND_GiangVien: 7,
    });
    dataSource.query
      .mockResolvedValueOnce([{ NoiDung: 'Nham vung React co ban' }])
      .mockResolvedValueOnce([{ NoiDung: 'Biet JavaScript co ban' }])
      .mockResolvedValueOnce([
        {
          maChuong: 1,
          tenChuong: 'Chuong 1',
          thuTuChuong: 1,
          maBH: 10,
          tenBaiHoc: 'Bai 1',
          thuTuBaiHoc: 1,
          noiDungBaiHoc: 'Noi dung',
          videoURL: 'https://example.com/video.mp4',
          trangThaiBaiHoc: 'ACTIVE',
        },
      ])
      .mockResolvedValueOnce([
        {
          reviewId: 501,
          rating: 5,
          content: 'Khoa hoc rat hay',
          createdAt: '2026-06-10 09:00:00',
          parentId: null,
          userId: 30002,
          userName: 'Hoc vien A',
          userAvatar: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          maLSKD: 99,
          hanhDong: 'REJECT',
          ghiChu: 'Can bo sung bai tap',
          thoiGian: '2026-06-10 08:00:00',
          adminId: 1,
          adminName: 'Admin A',
        },
      ]);

    await expect(service.getCourseDetail(11)).resolves.toEqual({
      id: 11,
      tenKhoaHoc: 'React Co Ban',
      moTa: 'Mo ta',
      giaBan: 399000,
      trangThai: 'PENDING',
      hinhThuNho: 'https://example.com/course.png',
      ngayCapNhat: '2026-06-10T09:00:00.000Z',
      maDM: 4,
      instructorId: 7,
      mucTieu: ['Nham vung React co ban'],
      yeuCau: ['Biet JavaScript co ban'],
      curriculum: [
        {
          maChuong: 1,
          tenChuong: 'Chuong 1',
          thuTu: 1,
          baiHocs: [
            expect.objectContaining({
              maBH: 10,
              tenBaiHoc: 'Bai 1',
              thuTu: 1,
              noiDung: 'Noi dung',
              videoURL: 'https://example.com/video.mp4',
              trangThai: 'ACTIVE',
            }),
          ],
        },
      ],
      reviews: [
        {
          reviewId: 501,
          rating: 5,
          content: 'Khoa hoc rat hay',
          createdAt: '2026-06-10 09:00:00',
          parentId: null,
          userId: 30002,
          userName: 'Hoc vien A',
          userAvatar: null,
        },
      ],
      moderationHistory: [
        {
          maLSKD: 99,
          hanhDong: 'REJECT',
          ghiChu: 'Can bo sung bai tap',
          thoiGian: '2026-06-10 08:00:00',
          adminId: 1,
          adminName: 'Admin A',
        },
      ],
    });

    expect(lessonVideoStorageService.getPlayableUrl).toHaveBeenCalledWith(
      'https://example.com/video.mp4',
    );
  });

  it('approves pending courses and writes moderation history', async () => {
    const course = {
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      trangThai: 'PENDING',
      maND_GiangVien: 7,
    };
    courseRepository.findOne.mockResolvedValue(course);
    courseRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );
    notificationsService.createNotification.mockImplementation((value) =>
      resolveValue(value),
    );
    moderationHistoryRepository.create.mockImplementation((value) => value);
    moderationHistoryRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );

    await expect(service.approveCourse(11, 99)).resolves.toEqual({
      message: 'Đã phê duyệt khóa học thành công.',
      data: { id: 11, trangThai: 'PUBLISHED' },
    });

    expect(notificationsService.createNotification).toHaveBeenCalledWith({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khóa học đã được phê duyệt',
      noiDung: expect.stringContaining('React Co Ban'),
      daDoc: false,
    });
    expect(moderationHistoryRepository.create).toHaveBeenCalledWith({
      maKH: 11,
      maND_Admin: 99,
      hanhDong: 'APPROVE',
      ghiChu: null,
    });
  });

  it('rejects pending courses, creates notification with sender, and writes moderation history', async () => {
    const course = {
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      trangThai: 'PENDING',
      maND_GiangVien: 7,
    };
    courseRepository.findOne.mockResolvedValue(course);
    courseRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );
    notificationsService.createNotification.mockImplementation((value) =>
      resolveValue(value),
    );
    moderationHistoryRepository.create.mockImplementation((value) => value);
    moderationHistoryRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );

    await expect(
      service.rejectCourse(11, 99, 'Thieu noi dung bai hoc thuc hanh.'),
    ).resolves.toEqual({
      message: 'Đã từ chối khóa học và chuyển về bản nháp.',
      data: {
        id: 11,
        trangThai: 'DRAFT',
        lyDo: 'Thieu noi dung bai hoc thuc hanh.',
      },
    });

    expect(notificationsService.createNotification).toHaveBeenCalledWith({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khóa học bị từ chối xuất bản',
      noiDung: expect.stringContaining('Thieu noi dung bai hoc thuc hanh.'),
      daDoc: false,
    });
    expect(moderationHistoryRepository.create).toHaveBeenCalledWith({
      maKH: 11,
      maND_Admin: 99,
      hanhDong: 'REJECT',
      ghiChu: 'Thieu noi dung bai hoc thuc hanh.',
    });
  });

  it('bans published courses and writes moderation history', async () => {
    const course = {
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      trangThai: 'PUBLISHED',
      maND_GiangVien: 7,
    };
    courseRepository.findOne.mockResolvedValue(course);
    courseRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );
    notificationsService.createNotification.mockImplementation((value) =>
      resolveValue(value),
    );
    moderationHistoryRepository.create.mockImplementation((value) => value);
    moderationHistoryRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );

    await expect(
      service.banPublishedCourse(11, 99, 'Vi pham noi dung khoa hoc.'),
    ).resolves.toEqual({
      message: 'Đã ban khóa học thành công.',
      data: {
        id: 11,
        trangThai: 'BANNED',
        lyDo: 'Vi pham noi dung khoa hoc.',
      },
    });

    expect(notificationsService.createNotification).toHaveBeenCalledWith({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khóa học đã bị ban',
      noiDung: expect.stringContaining('đã bị ban do vi phạm yêu cầu hệ thống'),
      daDoc: false,
    });
    expect(moderationHistoryRepository.create).toHaveBeenCalledWith({
      maKH: 11,
      maND_Admin: 99,
      hanhDong: 'BAN',
      ghiChu: 'Vi pham noi dung khoa hoc.',
    });
  });

  it('hides published courses by moving them back to draft and writes moderation history', async () => {
    const course = {
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      trangThai: 'PUBLISHED',
      maND_GiangVien: 7,
    };
    courseRepository.findOne.mockResolvedValue(course);
    courseRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );
    notificationsService.createNotification.mockImplementation((value) =>
      resolveValue(value),
    );
    moderationHistoryRepository.create.mockImplementation((value) => value);
    moderationHistoryRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );

    await expect(
      service.hidePublishedCourse(11, 99, 'Vi pham tieu chuan khoa hoc.'),
    ).resolves.toEqual({
      message: 'Đã ẩn khóa học vi phạm tiêu chuẩn và chuyển về bản nháp.',
      data: {
        id: 11,
        trangThai: 'DRAFT',
        lyDo: 'Vi pham tieu chuan khoa hoc.',
      },
    });

    expect(notificationsService.createNotification).toHaveBeenCalledWith({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khóa học vi phạm tiêu chuẩn',
      noiDung: expect.stringContaining('vi phạm tiêu chuẩn hệ thống'),
      daDoc: false,
    });
    expect(moderationHistoryRepository.create).toHaveBeenCalledWith({
      maKH: 11,
      maND_Admin: 99,
      hanhDong: 'HIDE',
      ghiChu: 'Vi pham tieu chuan khoa hoc.',
    });
  });

  it('requires a reject reason', async () => {
    await expect(service.rejectCourse(11, 99, '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects missing courses', async () => {
    courseRepository.findOne.mockResolvedValue(null);
    await expect(service.approveCourse(99, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
