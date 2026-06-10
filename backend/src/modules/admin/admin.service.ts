import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardStatsDto } from './dto/admin-dashboard.dto';

type CountGrowthRow = {
  total?: string | number;
  currentMonth?: string | number;
  lastMonth?: string | number;
};

type RevenueGrowthRow = CountGrowthRow;
type OrdersOverviewRow = {
  totalOrders?: string | number;
  totalEarnings?: string | number;
  totalRefunds?: string | number;
};
type SalesChartRow = {
  month?: string;
  year?: string | number;
  orders?: string | number;
  earnings?: string | number;
  refunds?: string | number;
};
type TopCourseRow = {
  id?: string | number;
  name?: string;
  date?: string;
  price?: string | number;
  orders?: string | number;
  revenue?: string | number;
  image?: string | null;
};

type TopInstructorRow = {
  id?: string | number;
  name?: string;
  category?: string | null;
  students?: string | number;
  revenue?: string | number;
  percentage?: string | number;
  avatar?: string | null;
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dataSource: DataSource) {}

  private calculateGrowth(
    currentMonth?: string | number,
    lastMonth?: string | number,
  ): number {
    const current = Number(currentMonth ?? 0);
    const last = Number(lastMonth ?? 0);

    if (last === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - last) / last) * 100).toFixed(1));
  }

  async getOverviewStats(): Promise<DashboardStatsDto> {
    const [
      studentStats,
      instructorStats,
      courseStats,
      revenueStats,
      recentOrders,
      chartData,
      ordersOverview,
      salesChartRows,
      topCourseRows,
      topInstructorRows,
    ] = await Promise.all([
      this.queryWithFallback<CountGrowthRow[]>(
        `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN 1 ELSE 0 END) as currentMonth,
            SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN 1 ELSE 0 END) as lastMonth
          FROM NguoiDung
          WHERE VaiTro = 'STUDENT' AND TrangThai = 'ACTIVE'
        `,
        [{ total: '0', currentMonth: '0', lastMonth: '0' }],
      ),
      this.queryWithFallback<CountGrowthRow[]>(
        `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN 1 ELSE 0 END) as currentMonth,
            SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN 1 ELSE 0 END) as lastMonth
          FROM NguoiDung
          WHERE VaiTro = 'INSTRUCTOR' AND TrangThai = 'ACTIVE'
        `,
        [{ total: '0', currentMonth: '0', lastMonth: '0' }],
      ),
      this.queryWithFallback<CountGrowthRow[]>(
        `
          SELECT COUNT(*) as total
          FROM KhoaHoc
          WHERE TrangThai != 'DELETED'
        `,
        [{ total: '0' }],
      ),
      this.queryWithFallback<RevenueGrowthRow[]>(
        `
          SELECT 
            IFNULL(SUM(TongTien), 0) as total,
            IFNULL(SUM(CASE WHEN DATE_FORMAT(NgayThanhToan, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN TongTien ELSE 0 END), 0) as currentMonth,
            IFNULL(SUM(CASE WHEN DATE_FORMAT(NgayThanhToan, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN TongTien ELSE 0 END), 0) as lastMonth
          FROM HoaDon
          WHERE TrangThaiThanhToan = 'PAID'
        `,
        [{ total: '0', currentMonth: '0', lastMonth: '0' }],
      ),
      this.queryWithFallback<any[]>(
        `
          SELECT 
            hd.MaHD as orderId,
            nd.HoTen as customerName,
            hd.TongTien as totalAmount,
            IFNULL(hd.NgayThanhToan, hd.NgayLap) as paidAt,
            IFNULL(hd.PhuongThucThanhToan, 'Chuyen khoan') as paymentMethod
          FROM HoaDon hd
          JOIN NguoiDung nd ON hd.MaND = nd.MaND
          WHERE hd.TrangThaiThanhToan = 'PAID'
          ORDER BY hd.NgayLap DESC
          LIMIT 5
        `,
        [],
      ),
      this.queryWithFallback<any[]>(
        `
          SELECT 
            MONTH(NgayLap) as thang,
            YEAR(NgayLap) as nam,
            SUM(TongTien) as doanhThu
          FROM HoaDon
          WHERE TrangThaiThanhToan = 'PAID'
          GROUP BY YEAR(NgayLap), MONTH(NgayLap)
          ORDER BY nam DESC, thang DESC
          LIMIT 6
        `,
        [],
      ),
      this.queryWithFallback<OrdersOverviewRow[]>(
        `
          SELECT
            COUNT(*) as totalOrders,
            IFNULL(SUM(CASE WHEN TrangThaiThanhToan = 'PAID' THEN TongTien ELSE 0 END), 0) as totalEarnings,
            0 as totalRefunds
          FROM HoaDon
        `,
        [{ totalOrders: '0', totalEarnings: '0', totalRefunds: '0' }],
      ),
      this.queryWithFallback<SalesChartRow[]>(
        `
          SELECT
            MONTH(NgayLap) as month,
            YEAR(NgayLap) as year,
            COUNT(*) as orders,
            IFNULL(SUM(CASE WHEN TrangThaiThanhToan = 'PAID' THEN TongTien ELSE 0 END), 0) as earnings,
            0 as refunds
          FROM HoaDon
          WHERE NgayLap >= DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH)
          GROUP BY YEAR(NgayLap), MONTH(NgayLap)
          ORDER BY year ASC, month ASC
        `,
        [],
      ),
      this.queryWithFallback<TopCourseRow[]>(
        `
          SELECT
            kh.MaKH as id,
            kh.TenKhoaHoc as name,
            MAX(IFNULL(hd.NgayThanhToan, hd.NgayLap)) as date,
            kh.GiaBan as price,
            COUNT(*) as orders,
            COUNT(*) * kh.GiaBan as revenue,
            kh.HinhThuNho as image
          FROM ChiTietHoaDon cthd
          JOIN HoaDon hd ON cthd.MaHD = hd.MaHD
          JOIN KhoaHoc kh ON cthd.MaKH = kh.MaKH
          WHERE hd.TrangThaiThanhToan = 'PAID'
          GROUP BY kh.MaKH, kh.TenKhoaHoc, kh.GiaBan, kh.HinhThuNho
          ORDER BY revenue DESC, orders DESC
          LIMIT 5
        `,
        [],
      ),
      this.queryWithFallback<TopInstructorRow[]>(
        `
          SELECT
            nd.MaND as id,
            nd.HoTen as name,
            COALESCE(MAX(hsgv.ChuyenMon), MAX(dm.TenDM), 'Giang vien') as category,
            COUNT(DISTINCT hd.MaND) as students,
            COUNT(*) * AVG(kh.GiaBan) as revenue,
            ROUND(
              (
                (COUNT(*) * AVG(kh.GiaBan)) /
                NULLIF((
                  SELECT IFNULL(SUM(hd2.TongTien), 0)
                  FROM HoaDon hd2
                  WHERE hd2.TrangThaiThanhToan = 'PAID'
                ), 0)
              ) * 100,
              1
            ) as percentage,
            nd.AnhDaiDien as avatar
          FROM ChiTietHoaDon cthd
          JOIN HoaDon hd ON cthd.MaHD = hd.MaHD
          JOIN KhoaHoc kh ON cthd.MaKH = kh.MaKH
          JOIN NguoiDung nd ON kh.MaND_GiangVien = nd.MaND
          LEFT JOIN HoSoGiangVien hsgv ON nd.MaND = hsgv.MaND
          LEFT JOIN DanhMuc dm ON kh.MaDM = dm.MaDM
          WHERE hd.TrangThaiThanhToan = 'PAID'
          GROUP BY nd.MaND, nd.HoTen, nd.AnhDaiDien
          ORDER BY revenue DESC, students DESC
          LIMIT 5
        `,
        [],
      ),
    ]);

    const salesChart = this.buildSalesChart(salesChartRows);

    return {
      totalStudents: parseInt(String(studentStats[0]?.total ?? 0), 10),
      studentGrowth: this.calculateGrowth(
        studentStats[0]?.currentMonth,
        studentStats[0]?.lastMonth,
      ),
      totalInstructors: parseInt(String(instructorStats[0]?.total ?? 0), 10),
      instructorGrowth: this.calculateGrowth(
        instructorStats[0]?.currentMonth,
        instructorStats[0]?.lastMonth,
      ),
      totalCourses: parseInt(String(courseStats[0]?.total ?? 0), 10),
      courseGrowth: 0,
      totalRevenue: parseFloat(String(revenueStats[0]?.total ?? 0)),
      revenueGrowth: this.calculateGrowth(
        revenueStats[0]?.currentMonth,
        revenueStats[0]?.lastMonth,
      ),
      recentOrders,
      revenueChart: [...chartData].reverse(),
      salesOverview: {
        orders: Number(ordersOverview[0]?.totalOrders ?? 0),
        earnings: Number(ordersOverview[0]?.totalEarnings ?? 0),
        refunds: Number(ordersOverview[0]?.totalRefunds ?? 0),
      },
      salesChart,
      topCourses: topCourseRows.map((row) => ({
        id: Number(row.id ?? 0),
        name: row.name ?? '',
        date: row.date ?? '',
        price: Number(row.price ?? 0),
        orders: Number(row.orders ?? 0),
        revenue: Number(row.revenue ?? 0),
        image: row.image ?? '',
      })),
      topInstructors: topInstructorRows.map((row) => ({
        id: Number(row.id ?? 0),
        name: row.name ?? '',
        category: row.category ?? 'Giang vien',
        students: Number(row.students ?? 0),
        revenue: Number(row.revenue ?? 0),
        percentage: Number(row.percentage ?? 0),
        avatar: row.avatar ?? '',
      })),
    };
  }

  private async queryWithFallback<T>(sql: string, fallback: T): Promise<T> {
    try {
      return await this.dataSource.query(sql);
    } catch (error) {
      console.error('Admin dashboard query failed:', error);
      return fallback;
    }
  }

  private buildSalesChart(rows: SalesChartRow[]) {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (11 - index),
        1,
      );
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: monthNames[date.getMonth()],
      };
    });

    const rowMap = new Map(
      rows.map((row) => [`${row.year}-${row.month}`, row]),
    );

    return months.map((item) => {
      const row = rowMap.get(`${item.year}-${item.month}`);
      return {
        label: item.label,
        orders: Number(row?.orders ?? 0),
        earnings: Number(row?.earnings ?? 0),
        refunds: Number(row?.refunds ?? 0),
      };
    });
  }
}

export { AdminDashboardService as AdminService };
