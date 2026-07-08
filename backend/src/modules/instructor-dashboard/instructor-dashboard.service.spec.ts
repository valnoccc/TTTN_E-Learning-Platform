import { UserRole } from '../users/entities/user.entity';
import { InstructorDashboardService } from './services/instructor-dashboard.service';

describe('InstructorDashboardService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new InstructorDashboardService(dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
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
      .mockResolvedValueOnce([{ activeCourses: '3', pendingCourses: '1' }])
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
      ])
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

  it('returns monthly revenue grouped by month and course', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        monthLabel: '07/2026',
        monthSort: '2026-07',
        courseId: '11',
        courseName: 'ReactJS Thực Chiến',
        purchases: '3',
        grossRevenue: '1500000',
      },
      {
        monthLabel: '07/2026',
        monthSort: '2026-07',
        courseId: '12',
        courseName: 'AWS Thực Chiến Cho Developer',
        purchases: '2',
        grossRevenue: '1000000',
      },
      {
        monthLabel: '06/2026',
        monthSort: '2026-06',
        courseId: '13',
        courseName: 'Playwright Testing Từ Cơ Bản Đến Nâng Cao',
        purchases: '4',
        grossRevenue: '2000000',
      },
    ]);

    const result = await service.getMyMonthlyRevenue(
      { maND: 7, vaiTro: UserRole.INSTRUCTOR },
      2026,
    );

    expect(result.year).toBe(2026);
    expect(result.months).toHaveLength(2);
    expect(result.months[0]).toMatchObject({
      month: '07/2026',
      totalPurchases: 5,
      totalGrossRevenue: 2500000,
    });
    expect(result.months[0].rows[0]).toMatchObject({
      courseId: 11,
      courseName: 'ReactJS Thực Chiến',
      purchases: 3,
      grossRevenue: 1500000,
      averageRevenue: 500000,
    });
    expect(result.months[1]).toMatchObject({
      month: '06/2026',
      totalPurchases: 4,
      totalGrossRevenue: 2000000,
    });

    const queryCalls = dataSource.query.mock.calls as Array<[string]>;
    expect(queryCalls[0]?.[0]).toContain("DATE_FORMAT(dk.NgayDangKy, '%m/%Y')");
    expect(queryCalls[0]?.[0]).toContain('YEAR(dk.NgayDangKy) = ?');
  });
});
