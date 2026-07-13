import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WishlistService {
  constructor(private readonly dataSource: DataSource) {}

  /** Lấy danh sách yêu thích của user */
  async getWishlist(userId: number) {
    const rows = await this.dataSource.query(
      `SELECT
         k.MaKH        AS id,
         k.TenKhoaHoc  AS courseName,
         k.HinhThuNho  AS thumbnail,
         IFNULL(k.GiaBan, 0) AS price,
         IFNULL(n.HoTen, 'Unknown Instructor') AS instructor,
         IFNULL(dm.TenDM, 'General')           AS category
       FROM YeuThich yt
       JOIN KhoaHoc   k  ON k.MaKH  = yt.MaKH
       LEFT JOIN NguoiDung n  ON n.MaND  = k.MaND_GiangVien
       LEFT JOIN DanhMuc   dm ON dm.MaDM = k.MaDM
       WHERE yt.MaND = ?
       ORDER BY yt.NgayThem DESC`,
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

  /** Toggle: nếu đã có thì xóa, chưa có thì thêm */
  async toggleWishlist(userId: number, courseId: number) {
    const existing = await this.dataSource.query(
      `SELECT MaKH FROM YeuThich WHERE MaND = ? AND MaKH = ? LIMIT 1`,
      [userId, courseId],
    );

    if (existing.length > 0) {
      await this.dataSource.query(
        `DELETE FROM YeuThich WHERE MaND = ? AND MaKH = ?`,
        [userId, courseId],
      );
      return { action: 'removed', courseId };
    } else {
      await this.dataSource.query(
        `INSERT IGNORE INTO YeuThich (MaND, MaKH) VALUES (?, ?)`,
        [userId, courseId],
      );
      return { action: 'added', courseId };
    }
  }

  /** Xóa một khóa học khỏi wishlist */
  async removeFromWishlist(userId: number, courseId: number) {
    await this.dataSource.query(
      `DELETE FROM YeuThich WHERE MaND = ? AND MaKH = ?`,
      [userId, courseId],
    );
    return { success: true };
  }

  /** Kiểm tra một courseId có trong wishlist không */
  async isInWishlist(userId: number, courseId: number): Promise<boolean> {
    const rows = await this.dataSource.query(
      `SELECT MaKH FROM YeuThich WHERE MaND = ? AND MaKH = ? LIMIT 1`,
      [userId, courseId],
    );
    return rows.length > 0;
  }

  /** Sync: nhận danh sách courseIds từ client (localStorage cũ) và insert vào DB */
  async syncWishlistFromClient(userId: number, courseIds: number[]) {
    if (!courseIds || courseIds.length === 0) return { success: true };
    for (const courseId of courseIds) {
      await this.dataSource.query(
        `INSERT IGNORE INTO YeuThich (MaND, MaKH) VALUES (?, ?)`,
        [userId, courseId],
      );
    }
    return { success: true };
  }
}
