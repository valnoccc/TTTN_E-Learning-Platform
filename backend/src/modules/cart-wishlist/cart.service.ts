import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CartService {
  constructor(private readonly dataSource: DataSource) {}

  /** Lấy (hoặc tạo mới) GioHang cho user, trả về MaGH */
  private async getOrCreateCart(userId: number): Promise<number> {
    // Thử lấy cart đã tồn tại
    const existing = await this.dataSource.query(
      `SELECT MaGioHang FROM GioHang WHERE MaND = ? LIMIT 1`,
      [userId],
    );
    if (existing.length > 0) {
      return Number(existing[0].MaGioHang);
    }

    // Tạo cart mới
    const result = await this.dataSource.query(
      `INSERT INTO GioHang (MaND) VALUES (?)`,
      [userId],
    );
    return Number(result.insertId);
  }

  /** Lấy danh sách khóa học trong giỏ của user */
  async getCart(userId: number) {
    const rows = await this.dataSource.query(
      `SELECT
         k.MaKH        AS id,
         k.TenKhoaHoc  AS courseName,
         k.HinhThuNho  AS thumbnail,
         IFNULL(k.GiaBan, 0) AS price,
         IFNULL(n.HoTen, 'Unknown Instructor') AS instructor,
         IFNULL(dm.TenDM, 'General')           AS category
       FROM ChiTietGioHang ctgh
       JOIN GioHang   gh ON gh.MaGioHang = ctgh.MaGioHang
       JOIN KhoaHoc   k  ON k.MaKH  = ctgh.MaKH
       LEFT JOIN NguoiDung n  ON n.MaND  = k.MaND_GiangVien
       LEFT JOIN DanhMuc   dm ON dm.MaDM = k.MaDM
       WHERE gh.MaND = ?
       ORDER BY ctgh.MaCTGH DESC`,
      [userId],
    );

    return rows.map((r: any) => ({
      id: Number(r.id),
      courseName: r.courseName,
      thumbnail: r.thumbnail || '/assets/images/course-1.jpg',
      price: parseFloat(r.price),
      instructor: r.instructor,
      category: r.category,
      duration: '120 Min',
      level: 'All Levels',
    }));
  }

  /** Thêm một khóa học vào giỏ (bỏ qua nếu đã tồn tại) */
  async addToCart(userId: number, courseId: number) {
    const cartId = await this.getOrCreateCart(userId);
    await this.dataSource.query(
      `INSERT IGNORE INTO ChiTietGioHang (MaGioHang, MaKH) VALUES (?, ?)`,
      [cartId, courseId],
    );
    return { success: true };
  }

  /** Xóa một khóa học khỏi giỏ */
  async removeFromCart(userId: number, courseId: number) {
    await this.dataSource.query(
      `DELETE ctgh FROM ChiTietGioHang ctgh
       JOIN GioHang gh ON gh.MaGioHang = ctgh.MaGioHang
       WHERE gh.MaND = ? AND ctgh.MaKH = ?`,
      [userId, courseId],
    );
    return { success: true };
  }

  /** Xóa toàn bộ giỏ hàng */
  async clearCart(userId: number) {
    await this.dataSource.query(
      `DELETE ctgh FROM ChiTietGioHang ctgh
       JOIN GioHang gh ON gh.MaGioHang = ctgh.MaGioHang
       WHERE gh.MaND = ?`,
      [userId],
    );
    return { success: true };
  }

  /** Sync: nhận danh sách courseIds từ client (localStorage cũ) và insert vào DB */
  async syncCartFromClient(userId: number, courseIds: number[]) {
    if (!courseIds || courseIds.length === 0) return { success: true };
    const cartId = await this.getOrCreateCart(userId);
    for (const courseId of courseIds) {
      await this.dataSource.query(
        `INSERT IGNORE INTO ChiTietGioHang (MaGioHang, MaKH) VALUES (?, ?)`,
        [cartId, courseId],
      );
    }
    return { success: true };
  }
}
