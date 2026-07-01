import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardStatsDto } from './dto/admin-dashboard.dto';

type CountGrowthRow = {
  total?: string | number;
  currentMonth?: string | number;
  lastMonth?: string | number;
};

type RevenueGrowthRow = CountGrowthRow;

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dataSource: DataSource) {}

  private calculateGrowth(
    currentMonth?: string | number,
    lastMonth?: string | number,
  ): number {
    const current = Number(currentMonth ?? 0);
    const last = Number(lastMonth ?? 0);
    if (last === 0) return current > 0 ? 100 : 0;
    return Number((((current - last) / last) * 100).toFixed(1));
  }

  async getOverviewStats(): Promise<any> {
    const [
      studentStats,
      instructorStats,
      courseStats,
      revenueStats,
      recentOrders,
      chartData,
      topCourses, // Thêm Query lấy Top Khóa học
      topInstructors, // Thêm Query lấy Top Giảng viên
    ] = await Promise.all([
      // ... (Giữ nguyên các query cũ của bạn) ...
      this.queryWithFallback<CountGrowthRow[]>(
        `SELECT COUNT(*) as total, SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN 1 ELSE 0 END) as currentMonth, SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN 1 ELSE 0 END) as lastMonth FROM NguoiDung WHERE VaiTro = 'STUDENT' AND TrangThai = 'ACTIVE'`,
        [{ total: '0', currentMonth: '0', lastMonth: '0' }],
      ),
      this.queryWithFallback<CountGrowthRow[]>(
        `SELECT COUNT(*) as total, SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN 1 ELSE 0 END) as currentMonth, SUM(CASE WHEN DATE_FORMAT(NgayTao, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN 1 ELSE 0 END) as lastMonth FROM NguoiDung WHERE VaiTro = 'INSTRUCTOR' AND TrangThai = 'ACTIVE'`,
        [{ total: '0', currentMonth: '0', lastMonth: '0' }],
      ),
      this.queryWithFallback<CountGrowthRow[]>(
        `SELECT COUNT(*) as total FROM KhoaHoc WHERE TrangThai != 'DELETED'`,
        [{ total: '0' }],
      ),
      this.queryWithFallback<RevenueGrowthRow[]>(
        `SELECT IFNULL(SUM(TongTien), 0) as total, IFNULL(SUM(CASE WHEN DATE_FORMAT(NgayThanhToan, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN TongTien ELSE 0 END), 0) as currentMonth, IFNULL(SUM(CASE WHEN DATE_FORMAT(NgayThanhToan, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN TongTien ELSE 0 END), 0) as lastMonth FROM HoaDon WHERE TrangThaiThanhToan = 'PAID'`,
        [{ total: '0', currentMonth: '0', lastMonth: '0' }],
      ),
      this.queryWithFallback<any[]>(
        `SELECT hd.MaHD as orderId, nd.HoTen as customerName, hd.TongTien as totalAmount, IFNULL(hd.NgayThanhToan, hd.NgayLap) as paidAt, IFNULL(hd.PhuongThucThanhToan, 'Chuyen khoan') as paymentMethod FROM HoaDon hd JOIN NguoiDung nd ON hd.MaND = nd.MaND WHERE hd.TrangThaiThanhToan = 'PAID' ORDER BY hd.NgayLap DESC LIMIT 5`,
        [],
      ),
      this.queryWithFallback<any[]>(
        `SELECT MONTH(NgayLap) as thang, YEAR(NgayLap) as nam, SUM(TongTien) as doanhThu FROM HoaDon WHERE TrangThaiThanhToan = 'PAID' GROUP BY YEAR(NgayLap), MONTH(NgayLap) ORDER BY nam DESC, thang DESC LIMIT 6`,
        [],
      ),

      // 1. Lấy Top Khóa học bán chạy nhất (Alias chuẩn cho Frontend)
      this.queryWithFallback<any[]>(
        `
          SELECT 
            kh.MaKH as id, 
            kh.TenKhoaHoc as name, 
            kh.NgayTao as date, 
            kh.Gia as price, 
            COUNT(ct.MaKH) as orders, 
            SUM(ct.GiaTien) as revenue, 
            IFNULL(kh.HinhAnh, 'https://placehold.co/100x100/e2e8f0/64748b?text=Course') as image
          FROM KhoaHoc kh
          JOIN ChiTietHoaDon ct ON kh.MaKH = ct.MaKH
          JOIN HoaDon hd ON ct.MaHD = hd.MaHD
          WHERE hd.TrangThaiThanhToan = 'PAID'
          GROUP BY kh.MaKH
          ORDER BY orders DESC
          LIMIT 5
        `,
        [],
      ),

      // 2. Lấy Top Giảng viên có doanh thu cao nhất (Alias chuẩn cho Frontend)
      this.queryWithFallback<any[]>(
        `
          SELECT 
            gv.MaND as id, 
            gv.HoTen as name, 
            'Giảng viên' as category, 
            COUNT(DISTINCT hd.MaND) as students, 
            SUM(ct.GiaTien) as revenue, 
            100 as percentage, 
            IFNULL(gv.HinhAnh, 'https://placehold.co/100x100/3b82f6/ffffff?text=GV') as avatar
          FROM NguoiDung gv
          JOIN KhoaHoc kh ON gv.MaND = kh.MaGiangVien
          JOIN ChiTietHoaDon ct ON kh.MaKH = ct.MaKH
          JOIN HoaDon hd ON ct.MaHD = hd.MaHD
          WHERE gv.VaiTro = 'INSTRUCTOR' AND hd.TrangThaiThanhToan = 'PAID'
          GROUP BY gv.MaND
          ORDER BY revenue DESC
          LIMIT 5
        `,
        [],
      ),
    ]);

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
      topCourses, // Trả về cho API
      topInstructors, // Trả về cho API
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
}

export { AdminDashboardService as AdminService };
