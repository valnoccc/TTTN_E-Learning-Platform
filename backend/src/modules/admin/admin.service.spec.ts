import { AdminDashboardService } from './admin.service';

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
      .mockResolvedValueOnce([
        { total: '1250000', currentMonth: '500000', lastMonth: '250000' },
      ])
      .mockResolvedValueOnce([
        {
          orderId: 1,
          customerName: 'Nguyen Van A',
          totalAmount: '250000',
          paidAt: '2026-06-01 08:00:00',
          paymentMethod: 'VNPAY',
        },
      ])
      .mockResolvedValueOnce([
        { thang: 6, nam: 2026, doanhThu: 500000 },
        { thang: 5, nam: 2026, doanhThu: 750000 },
      ])
      .mockResolvedValueOnce([
        { totalOrders: '20', totalEarnings: '1250000', totalRefunds: '0' },
      ])
      .mockResolvedValueOnce([
        { month: 5, year: 2026, orders: '8', earnings: '750000', refunds: '0' },
        {
          month: 6,
          year: 2026,
          orders: '12',
          earnings: '500000',
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
          image: 'https://example.com/react.png',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 7,
          name: 'Tran Van B',
          category: 'Frontend',
          students: '120',
          revenue: '12500000',
          percentage: '32.5',
          avatar: 'https://example.com/avatar.png',
        },
      ]);

    await expect(service.getOverviewStats()).resolves.toEqual({
      totalStudents: 10,
      studentGrowth: 100,
      totalInstructors: 3,
      instructorGrowth: -50,
      totalCourses: 8,
      courseGrowth: 0,
      totalRevenue: 1250000,
      revenueGrowth: 100,
      recentOrders: [
        {
          orderId: 1,
          customerName: 'Nguyen Van A',
          totalAmount: '250000',
          paidAt: '2026-06-01 08:00:00',
          paymentMethod: 'VNPAY',
        },
      ],
      revenueChart: [
        { thang: 5, nam: 2026, doanhThu: 750000 },
        { thang: 6, nam: 2026, doanhThu: 500000 },
      ],
      salesOverview: {
        orders: 20,
        earnings: 1250000,
        refunds: 0,
      },
      salesChart: [
        { label: 'Jul', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Aug', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Sep', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Oct', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Nov', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Dec', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Jan', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Feb', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Mar', orders: 0, earnings: 0, refunds: 0 },
        { label: 'Apr', orders: 0, earnings: 0, refunds: 0 },
        { label: 'May', orders: 8, earnings: 750000, refunds: 0 },
        { label: 'Jun', orders: 12, earnings: 500000, refunds: 0 },
      ],
      topCourses: [
        {
          id: 101,
          name: 'React Co Ban',
          date: '2026-06-01 08:00:00',
          price: 399000,
          orders: 15,
          revenue: 5985000,
          image: 'https://example.com/react.png',
        },
      ],
      topInstructors: [
        {
          id: 7,
          name: 'Tran Van B',
          category: 'Frontend',
          students: 120,
          revenue: 12500000,
          percentage: 32.5,
          avatar: 'https://example.com/avatar.png',
        },
      ],
    });
  });
});
