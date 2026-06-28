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
        coursePrice: '200000.00',
        purchasedAt: '2026-05-01 10:00:00',
      },
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 102,
        courseName: 'NestJS Co Ban',
        coursePrice: '360000.00',
        purchasedAt: '2026-05-02 12:00:00',
      },
      {
        studentId: 12,
        studentName: 'Tran Thi B',
        studentEmail: 'b@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '200000.00',
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
    expect(result.totalRevenue).toBe(760000);
    expect(result.students[0]).toMatchObject({
      studentId: 11,
      studentName: 'Nguyen Van A',
      courseId: 101,
      courseName: 'React Co Ban',
      totalSpent: 200000,
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

  it('returns instructor reports board with extended instructor dashboard metrics', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        {
          enrollments: '4',
          totalStudents: '3',
          grossRevenue: '1800000',
          adminRevenue: '360000',
          instructorRevenue: '1440000',
          revenue: '1440000',
        },
      ])
      .mockResolvedValueOnce([
        { enrollments: '2', totalStudents: '2', revenue: '720000' },
      ])
      .mockResolvedValueOnce([
        { activeCourses: '3', pendingCourses: '1' },
      ])
      .mockResolvedValueOnce([
        {
          totalStudents: '3',
          repeatStudents: '1',
          totalLessonSlots: '10',
          completedLessonSlots: '6',
        },
      ])
      .mockResolvedValueOnce([
        {
          periodLabel: '05/2026',
          grossRevenue: '900000',
          adminRevenue: '180000',
          instructorRevenue: '720000',
          revenue: '720000',
          enrollments: '2',
        },
        {
          periodLabel: '06/2026',
          grossRevenue: '900000',
          adminRevenue: '180000',
          instructorRevenue: '720000',
          revenue: '720000',
          enrollments: '2',
        },
      ])
      .mockResolvedValueOnce([
        {
          courseId: 10,
          courseName: 'React Pro',
          grossRevenue: '1200000',
          adminRevenue: '240000',
          instructorRevenue: '960000',
          revenue: '960000',
          enrollments: '3',
          averageRating: '4.8',
          reviewCount: '7',
          imageUrl: 'react.png',
        },
      ])
      .mockResolvedValueOnce([
        {
          courseId: 10,
          courseName: 'React Pro',
          averageRating: '4.9',
          reviewCount: '9',
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
          adminAmount: '80000',
          instructorAmount: '320000',
          amount: '320000',
          couponCode: null,
          status: 'ACTIVE',
          purchasedAt: '2026-06-10 09:00:00',
        },
      ])
      .mockResolvedValueOnce([
        {
          trafficSource: 'Coupon / Promo',
          orderCount: '7',
          grossRevenue: '1400000',
        },
        {
          trafficSource: 'Organic',
          orderCount: '5',
          grossRevenue: '800000',
        },
      ])
      .mockResolvedValueOnce([
        {
          averageRating: '4.6',
          reviewCount: '12',
          fiveStarReviews: '9',
          lowStarReviews: '1',
        },
      ]);
    dataSource.query
      .mockResolvedValueOnce([{ unrespondedReviews: '3' }])
      .mockResolvedValueOnce([
        { rating: '5', count: '9' },
        { rating: '4', count: '2' },
        { rating: '2', count: '1' },
      ])
      .mockResolvedValueOnce([{ unansweredQuestions: '5' }])
      .mockResolvedValueOnce([
        {
          courseId: '11',
          courseName: 'NestJS Advanced',
          reason: 'Can bo sung preview video',
          createdAt: '2026-06-20 09:00:00',
        },
      ])
      .mockResolvedValueOnce([{ expiringCoupons: '2' }]);

    const result = await service.getMyReports(
      { maND: 7, vaiTro: UserRole.INSTRUCTOR },
      { range: '30days' },
    );

    expect(result.overview.totalRevenue).toBe(1440000);
    expect(result.overview.grossRevenue).toBe(1800000);
    expect(result.overview.adminRevenue).toBe(360000);
    expect(result.overview.instructorRevenue).toBe(1440000);
    expect(result.overview.revenueGrowth).toBe(100);
    expect(result.overview.totalStudents).toBe(3);
    expect(result.overview.activeCourses).toBe(3);
    expect(result.overview.pendingCourses).toBe(1);
    expect(result.revenueSeriesSource).toBe('database');
    expect(result.topCoursesSource).toBe('database');
    expect(result.recentEnrollmentsSource).toBe('database');
    expect(result.overview.averageRating).toBe(4.6);
    expect(result.overview.averageRatingLabel).toBe('Tu 12 luot danh gia that');
    expect(result.overview.averageRatingSource).toBe('database');
    expect(result.learning.completionRate).toBe(60);
    expect(result.learning.repeatStudents).toBe(1);
    expect(result.quality.unrespondedReviews).toBe(3);
    expect(result.quality.topRatedCourses[0]).toMatchObject({
      courseId: 10,
      averageRating: 4.9,
    });
    expect(result.operations.unansweredQuestions).toBe(5);
    expect(result.operations.expiringCoupons).toBe(2);
    expect(result.operations.latestRejectedCourse).toMatchObject({
      courseId: 11,
      courseName: 'NestJS Advanced',
    });
    expect(result.traffic.revenueBySourceSource).toBe('database');
    expect(result.traffic.revenueBySource[0]).toMatchObject({
      label: 'Coupon / Promo',
      orderCount: 7,
      grossRevenue: 1400000,
    });
    expect(result.topCourses[0]).toMatchObject({
      courseId: 10,
      courseName: 'React Pro',
      revenue: 960000,
      grossRevenue: 1200000,
      adminRevenue: 240000,
      instructorRevenue: 960000,
      averageRating: 4.8,
      reviewCount: 7,
    });
    const queryCalls = dataSource.query.mock.calls as Array<[string]>;
    expect(queryCalls[0]?.[0]).toContain('* 0.2');
    expect(queryCalls[0]?.[0]).toContain('* 0.8');
  });
});
