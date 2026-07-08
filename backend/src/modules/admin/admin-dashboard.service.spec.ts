import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new AdminDashboardService(dataSource as never);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-10T00:00:00.000Z'));
    dataSource.query.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns dashboard stats including top courses and top instructors', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        { total: '10', currentMonth: '4', lastMonth: '2' },
      ])
      .mockResolvedValueOnce([
        { total: '3', currentMonth: '1', lastMonth: '2' },
      ])
      .mockResolvedValueOnce([{ total: '8' }])
      .mockResolvedValueOnce([{ total: '3' }])
      .mockResolvedValueOnce([
        { total: '5', currentMonth: '5', lastMonth: '2' },
      ])
      .mockResolvedValueOnce([
        {
          total: '250000',
          grossRevenue: '1250000',
          adminRevenue: '250000',
          instructorPayout: '1000000',
          currentMonth: '100000',
          lastMonth: '50000',
        },
      ])
      .mockResolvedValueOnce([
        {
          monthYear: '06-2026',
          usedSeconds: '6000',
        },
      ])
      .mockResolvedValueOnce([
        {
          monthYear: '06-2026',
          usedBytes: '2147483648',
        },
      ])
      .mockResolvedValueOnce([
        {
          orderId: 1,
          customerName: 'Nguyen Van A',
          courseName: 'React Co Ban',
          totalAmount: 250000,
          paidAt: '2026-06-01 08:00:00',
          paymentMethod: 'VNPAY',
          paymentStatus: 'PAID',
        },
      ])
      .mockResolvedValueOnce([
        { thang: 6, nam: 2026, doanhThu: 100000 },
        { thang: 5, nam: 2026, doanhThu: 150000 },
      ])
      .mockResolvedValueOnce([
        {
          totalOrders: '20',
          totalEarnings: '250000',
          grossRevenue: '1250000',
          adminRevenue: '250000',
          instructorPayout: '1000000',
          totalRefunds: '0',
        },
      ])
      .mockResolvedValueOnce([
        {
          month: 5,
          year: 2026,
          orders: '8',
          earnings: '150000',
          grossRevenue: '750000',
          adminRevenue: '150000',
          instructorPayout: '600000',
          refunds: '0',
        },
        {
          month: 6,
          year: 2026,
          orders: '12',
          earnings: '100000',
          grossRevenue: '500000',
          adminRevenue: '100000',
          instructorPayout: '400000',
          refunds: '0',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 101,
          name: 'React Co Ban',
          date: '2026-06-01 08:00:00',
          price: '399000',
          orders: '15',
          revenue: '5985000',
          adminRevenue: '1197000',
          instructorRevenue: '4788000',
          image: 'https://example.com/react.png',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 7,
          name: 'Tran Van B',
          category: 'Frontend',
          students: '120',
          revenue: '10000000',
          grossRevenue: '12500000',
          adminRevenue: '2500000',
          percentage: '32.5',
          avatar: 'https://example.com/avatar.png',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          name: 'Lap trinh',
          revenue: '900000',
          adminRevenue: '180000',
          instructorPayout: '720000',
        },
      ]);

    await expect(service.getOverviewStats()).resolves.toEqual({
      totalStudents: 10,
      studentGrowth: 100,
      totalInstructors: 3,
      instructorGrowth: -50,
      totalCourses: 8,
      courseGrowth: 0,
      pendingCourses: 3,
      pendingCourseGrowth: 0,
      newEnrollments: 5,
      newEnrollmentGrowth: 150,
      totalRevenue: 250000,
      grossRevenue: 1250000,
      adminRevenue: 250000,
      instructorPayout: 1000000,
      revenueGrowth: 100,
      aiQuota: {
        monthYear: '06-2026',
        usedSeconds: 6000,
        usedMinutes: 100,
        limitMinutes: 1000,
        remainingMinutes: 900,
        percentUsed: 10,
        isWarning: false,
        isExceeded: false,
      },
      storageQuota: {
        monthYear: '06-2026',
        usedBytes: 2147483648,
        usedMegabytes: 2048,
        limitMegabytes: 102400,
        remainingMegabytes: 100352,
        percentUsed: 2,
        isWarning: false,
        isExceeded: false,
      },
      recentOrders: [
        {
          orderId: 1,
          customerName: 'Nguyen Van A',
          courseName: 'React Co Ban',
          totalAmount: 250000,
          paidAt: '2026-06-01 08:00:00',
          paymentMethod: 'VNPAY',
          paymentStatus: 'PAID',
        },
      ],
      revenueChart: [
        { thang: 5, nam: 2026, doanhThu: 150000 },
        { thang: 6, nam: 2026, doanhThu: 100000 },
      ],
      salesOverview: {
        orders: 20,
        earnings: 250000,
        grossRevenue: 1250000,
        adminRevenue: 250000,
        instructorPayout: 1000000,
        refunds: 0,
      },
      salesChart: [
        {
          label: 'Jul',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Aug',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Sep',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Oct',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Nov',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Dec',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Jan',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Feb',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Mar',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'Apr',
          orders: 0,
          earnings: 0,
          grossRevenue: 0,
          adminRevenue: 0,
          instructorPayout: 0,
          refunds: 0,
        },
        {
          label: 'May',
          orders: 8,
          earnings: 150000,
          grossRevenue: 750000,
          adminRevenue: 150000,
          instructorPayout: 600000,
          refunds: 0,
        },
        {
          label: 'Jun',
          orders: 12,
          earnings: 100000,
          grossRevenue: 500000,
          adminRevenue: 100000,
          instructorPayout: 400000,
          refunds: 0,
        },
      ],
      topCourses: [
        {
          id: 101,
          name: 'React Co Ban',
          date: '2026-06-01 08:00:00',
          price: 399000,
          orders: 15,
          revenue: 5985000,
          adminRevenue: 1197000,
          instructorRevenue: 4788000,
          image: 'https://example.com/react.png',
        },
      ],
      topInstructors: [
        {
          id: 7,
          name: 'Tran Van B',
          category: 'Frontend',
          students: 120,
          revenue: 10000000,
          grossRevenue: 12500000,
          adminRevenue: 2500000,
          percentage: 32.5,
          avatar: 'https://example.com/avatar.png',
        },
      ],
      categoryRevenue: [
        {
          id: 1,
          name: 'Lap trinh',
          revenue: 900000,
          adminRevenue: 180000,
          instructorPayout: 720000,
        },
      ],
    });

    const queryCalls = dataSource.query.mock.calls as Array<[string]>;
    expect(queryCalls[5]?.[0]).toContain('* 0.2');
    expect(queryCalls[5]?.[0]).toContain('* 0.8');
    expect(queryCalls[9]?.[0]).toContain('* 0.2');
    expect(queryCalls[9]?.[0]).toContain('* 0.8');
  });

  it('returns instructor debt board for a selected month', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        instructorId: 7,
        instructorName: 'Tran Van B',
        instructorAvatar: 'https://example.com/avatar.png',
        specialty: 'Frontend',
        courseCount: '3',
        orderCount: '12',
        grossRevenue: '12500000',
        adminRevenue: '2500000',
        instructorPayout: '10000000',
      },
      {
        instructorId: 9,
        instructorName: 'Le Thi C',
        instructorAvatar: null,
        specialty: 'Backend',
        courseCount: '2',
        orderCount: '8',
        grossRevenue: '5000000',
        adminRevenue: '1000000',
        instructorPayout: '4000000',
      },
    ]);

    await expect(service.getInstructorDebtBoard(6, 2026)).resolves.toEqual({
      month: 6,
      year: 2026,
      monthLabel: 'Tháng 06/2026',
      summary: {
        totalInstructors: 2,
        totalCourses: 5,
        totalOrders: 20,
        grossRevenue: 17500000,
        adminRevenue: 3500000,
        instructorPayout: 14000000,
        topDebtAmount: 10000000,
      },
      items: [
        {
          instructorId: 7,
          instructorName: 'Tran Van B',
          instructorAvatar: 'https://example.com/avatar.png',
          specialty: 'Frontend',
          courseCount: 3,
          orderCount: 12,
          grossRevenue: 12500000,
          adminRevenue: 2500000,
          instructorPayout: 10000000,
          debtAmount: 10000000,
        },
        {
          instructorId: 9,
          instructorName: 'Le Thi C',
          instructorAvatar: null,
          specialty: 'Backend',
          courseCount: 2,
          orderCount: 8,
          grossRevenue: 5000000,
          adminRevenue: 1000000,
          instructorPayout: 4000000,
          debtAmount: 4000000,
        },
      ],
    });

    const query = dataSource.query.mock.calls[0]?.[0] as string;
    const params = dataSource.query.mock.calls[0]?.[1] as Array<number>;

    expect(query).toContain('YEAR(COALESCE(hd.NgayThanhToan, hd.NgayLap)) = ?');
    expect(query).toContain('* 0.2');
    expect(query).toContain('* 0.8');
    expect(params).toEqual([2026, 6]);
  });
});
