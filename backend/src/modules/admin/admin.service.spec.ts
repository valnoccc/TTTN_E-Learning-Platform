import { AdminDashboardService } from './admin.service';

describe('AdminDashboardService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new AdminDashboardService(dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
  });

  it('returns dashboard stats when all queries succeed', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ total: '10', currentMonth: '4', lastMonth: '2' }])
      .mockResolvedValueOnce([{ total: '3', currentMonth: '1', lastMonth: '2' }])
      .mockResolvedValueOnce([{ total: '8' }])
      .mockResolvedValueOnce([{ total: '1250000', currentMonth: '500000', lastMonth: '250000' }])
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
    });
  });

  it('falls back to an empty revenue chart when the chart query fails', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ total: '10', currentMonth: '0', lastMonth: '0' }])
      .mockResolvedValueOnce([{ total: '3', currentMonth: '0', lastMonth: '0' }])
      .mockResolvedValueOnce([{ total: '8' }])
      .mockResolvedValueOnce([{ total: '1250000', currentMonth: '0', lastMonth: '0' }])
      .mockResolvedValueOnce([
        {
          orderId: 1,
          customerName: 'Nguyen Van A',
          totalAmount: '250000',
          paidAt: '2026-06-01 08:00:00',
          paymentMethod: 'VNPAY',
        },
      ])
      .mockRejectedValueOnce(new Error('ER_NO_SUCH_TABLE: vw_DoanhThu'));

    await expect(service.getOverviewStats()).resolves.toEqual({
      totalStudents: 10,
      studentGrowth: 0,
      totalInstructors: 3,
      instructorGrowth: 0,
      totalCourses: 8,
      courseGrowth: 0,
      totalRevenue: 1250000,
      revenueGrowth: 0,
      recentOrders: [
        {
          orderId: 1,
          customerName: 'Nguyen Van A',
          totalAmount: '250000',
          paidAt: '2026-06-01 08:00:00',
          paymentMethod: 'VNPAY',
        },
      ],
      revenueChart: [],
    });
  });
});
