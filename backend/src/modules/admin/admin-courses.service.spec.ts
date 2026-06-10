import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminCoursesService } from './admin-courses.service';

describe('AdminCoursesService', () => {
  const resolveValue = <T>(value: T) => Promise.resolve(value);

  const dataSource = {
    query: jest.fn(),
  };

  const courseRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const notificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const moderationHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const service = new AdminCoursesService(
    courseRepository as never,
    notificationRepository as never,
    moderationHistoryRepository as never,
    dataSource as never,
  );

  beforeEach(() => {
    dataSource.query.mockReset();
    courseRepository.findOne.mockReset();
    courseRepository.save.mockReset();
    notificationRepository.create.mockReset();
    notificationRepository.save.mockReset();
    moderationHistoryRepository.create.mockReset();
    moderationHistoryRepository.save.mockReset();
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

  it('returns course detail with goals requirements curriculum and moderation history', async () => {
    courseRepository.findOne.mockResolvedValue({
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      moTa: 'Mo ta',
      giaBan: 399000,
      trangThai: 'PENDING',
      hinhThuNho: 'https://example.com/course.png',
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
            {
              maBH: 10,
              tenBaiHoc: 'Bai 1',
              thuTu: 1,
              noiDung: 'Noi dung',
              videoURL: 'https://example.com/video.mp4',
              trangThai: 'ACTIVE',
            },
          ],
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
  });

  it('approves pending courses and writes moderation history', async () => {
    const course = {
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      trangThai: 'PENDING',
      maND_GiangVien: 7,
    };
    courseRepository.findOne.mockResolvedValue(course);
    courseRepository.save.mockImplementation((value: unknown) => resolveValue(value));
    notificationRepository.create.mockImplementation((value) => value);
    notificationRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );
    moderationHistoryRepository.create.mockImplementation((value) => value);
    moderationHistoryRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );

    await expect(service.approveCourse(11, 99)).resolves.toEqual({
      message: 'Da phe duyet khoa hoc thanh cong.',
      data: { id: 11, trangThai: 'PUBLISHED' },
    });

    expect(notificationRepository.create).toHaveBeenCalledWith({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khoa hoc da duoc phe duyet',
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
    courseRepository.save.mockImplementation((value: unknown) => resolveValue(value));
    notificationRepository.create.mockImplementation((value) => value);
    notificationRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );
    moderationHistoryRepository.create.mockImplementation((value) => value);
    moderationHistoryRepository.save.mockImplementation((value: unknown) =>
      resolveValue(value),
    );

    await expect(
      service.rejectCourse(11, 99, 'Thieu noi dung bai hoc thuc hanh.'),
    ).resolves.toEqual({
      message: 'Da tu choi khoa hoc va chuyen ve ban nhap.',
      data: {
        id: 11,
        trangThai: 'DRAFT',
        lyDo: 'Thieu noi dung bai hoc thuc hanh.',
      },
    });

    expect(notificationRepository.create).toHaveBeenCalledWith({
      maND: 7,
      maNguoiGui: 99,
      loaiThongBao: 'COURSE',
      tieuDe: 'Khoa hoc bi tu choi xuat ban',
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
