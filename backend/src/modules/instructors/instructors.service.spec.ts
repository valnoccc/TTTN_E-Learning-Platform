import { ForbiddenException } from '@nestjs/common';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserRole } from '../users/entities/user.entity';
import { InstructorsService } from './services/instructors.service';

describe('InstructorsService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const userRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const hoSoRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const cloudinaryService = {
    extractPublicId: jest.fn(),
    deleteFile: jest.fn(),
    uploadFile: jest.fn(),
  } as unknown as CloudinaryService;

  const service = new InstructorsService(
    dataSource as never,
    userRepo as never,
    hoSoRepo as never,
    cloudinaryService,
  );

  beforeEach(() => {
    dataSource.query.mockReset();
    userRepo.findOne.mockReset();
    userRepo.createQueryBuilder.mockReset();
    hoSoRepo.findOne.mockReset();
    hoSoRepo.find.mockReset();
    hoSoRepo.create.mockReset();
    hoSoRepo.save.mockReset();
  });

  it('returns purchased students by student and course for the instructor', async () => {
    dataSource.query.mockResolvedValue([
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '250000.00',
        purchasedAt: '2026-05-01 10:00:00',
      },
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 102,
        courseName: 'NestJS Co Ban',
        coursePrice: '450000.00',
        purchasedAt: '2026-05-02 12:00:00',
      },
      {
        studentId: 12,
        studentName: 'Tran Thi B',
        studentEmail: 'b@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '250000.00',
        purchasedAt: '2026-05-03 08:00:00',
      },
    ]);

    const result = await service.getMyStudents(
      { maND: 7, vaiTro: UserRole.INSTRUCTOR },
      {},
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('dk.MaND'),
      [7],
    );
    expect(result.totalStudents).toBe(2);
    expect(result.totalPurchases).toBe(3);
    expect(result.totalRevenue).toBe(950000);
    expect(result.students[0]).toMatchObject({
      studentId: 11,
      studentName: 'Nguyen Van A',
      courseId: 101,
      courseName: 'React Co Ban',
      totalSpent: 250000,
    });
  });

  it('applies course and search filters when listing students', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.getMyStudents(
      { maND: 9, vaiTro: UserRole.INSTRUCTOR },
      { courseId: 77, search: 'lan' },
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.MaKH = ?'),
      [9, 77, '%lan%', '%lan%'],
    );
  });

  it('uses JWT subject as instructor id when listing students', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.getMyStudents({ sub: 5, vaiTro: UserRole.INSTRUCTOR }, {});

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.MaND_GiangVien = ?'),
      [5],
    );
  });

  it('rejects non instructor users', async () => {
    await expect(
      service.getMyStudents({ maND: 1, vaiTro: UserRole.STUDENT }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns instructor course options', async () => {
    dataSource.query.mockResolvedValue([
      {
        courseId: 1,
        courseName: 'TypeScript Essentials',
        coursePrice: '300000.00',
        status: 'PUBLISHED',
        createdAt: '2026-04-01 00:00:00',
      },
    ]);

    const result = await service.getMyCourses({
      maND: 7,
      vaiTro: UserRole.INSTRUCTOR,
    });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM KhoaHoc'),
      [7],
    );
    expect(result).toEqual([
      {
        courseId: 1,
        courseName: 'TypeScript Essentials',
        coursePrice: 300000,
        status: 'PUBLISHED',
        createdAt: '2026-04-01 00:00:00',
      },
    ]);
  });

  it('returns instructor reports board with database and mockdata sections separated', async () => {
    dataSource.query
      .mockResolvedValueOnce([{
        enrollments: '4',
        grossRevenue: '1800000',
        adminRevenue: '1080000',
        instructorRevenue: '720000',
        revenue: '720000',
      }])
      .mockResolvedValueOnce([{ enrollments: '2', revenue: '360000' }])
      .mockResolvedValueOnce([
        {
          periodLabel: '05/2026',
          grossRevenue: '900000',
          adminRevenue: '540000',
          instructorRevenue: '360000',
          revenue: '360000',
          enrollments: '2',
        },
        {
          periodLabel: '06/2026',
          grossRevenue: '900000',
          adminRevenue: '540000',
          instructorRevenue: '360000',
          revenue: '360000',
          enrollments: '2',
        },
      ])
      .mockResolvedValueOnce([
        {
          courseId: 10,
          courseName: 'React Pro',
          grossRevenue: '1200000',
          adminRevenue: '720000',
          instructorRevenue: '480000',
          revenue: '480000',
          enrollments: '3',
          imageUrl: 'react.png',
        },
      ])
      .mockResolvedValueOnce([
        {
          enrollmentCode: '#DK22',
          studentName: 'Nguyen Van C',
          studentEmail: 'c@example.com',
          studentAvatar: null,
          courseId: 10,
          courseName: 'React Pro',
          grossAmount: '400000',
          adminAmount: '240000',
          instructorAmount: '160000',
          amount: '160000',
          couponCode: null,
          status: 'ACTIVE',
          purchasedAt: '2026-06-10 09:00:00',
        },
      ]);

    const result = await service.getMyReports(
      { maND: 7, vaiTro: UserRole.INSTRUCTOR },
      { range: '30days' },
    );

    expect(result.overview.totalRevenue).toBe(720000);
    expect(result.overview.grossRevenue).toBe(1800000);
    expect(result.overview.adminRevenue).toBe(1080000);
    expect(result.overview.instructorRevenue).toBe(720000);
    expect(result.overview.revenueGrowth).toBe(100);
    expect(result.revenueSeriesSource).toBe('database');
    expect(result.topCoursesSource).toBe('database');
    expect(result.recentEnrollmentsSource).toBe('database');
    expect(result.overview.averageRatingSource).toBe('mockdata');
    expect(result.revenueBySourceSource).toBe('mockdata');
    expect(result.topCourses[0]).toMatchObject({
      courseId: 10,
      courseName: 'React Pro',
      revenue: 480000,
      grossRevenue: 1200000,
      adminRevenue: 720000,
      instructorRevenue: 480000,
      ratingLabel: 'MOCKDATA',
    });
  });
});
