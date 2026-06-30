import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    return await this.userRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: any) {
    const updateData: any = {};
    if (updateUserDto.hoTen) updateData.hoTen = updateUserDto.hoTen;
    if (updateUserDto.anhDaiDien)
      updateData.anhDaiDien = updateUserDto.anhDaiDien;
    if (updateUserDto.name) updateData.hoTen = updateUserDto.name;
    if (updateUserDto.fullName) updateData.hoTen = updateUserDto.fullName;
    if (updateUserDto.avatarUrl)
      updateData.anhDaiDien = updateUserDto.avatarUrl;
    if (updateUserDto.soDienThoai !== undefined)
      updateData.soDienThoai = updateUserDto.soDienThoai;

    console.log('Update Data mapped in users.service.ts:', updateData);

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }
    return this.userRepository.findOne({ where: { maND: id } });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async getMyCourses(userId: number) {
    const courses = await this.dataSource.query(
      `SELECT 
        k.MaKH as id, 
        k.TenKhoaHoc as title, 
        k.HinhThuNho as image, 
        IFNULL(
          ROUND(
            (
              SELECT COUNT(*) 
              FROM TienDoHocTap t 
              JOIN BaiHoc b ON t.MaBH = b.MaBH 
              WHERE b.MaKH = k.MaKH AND t.MaND = d.MaND AND t.DaHoanThanh = 1
            ) * 100.0 / NULLIF((
              SELECT COUNT(*) 
              FROM BaiHoc b2 
              WHERE b2.MaKH = k.MaKH
            ), 0)
          , 0)
        , 0) as progress 
       FROM DangKyKhoaHoc d
       JOIN KhoaHoc k ON d.MaKH = k.MaKH
       WHERE d.MaND = ? AND d.TrangThai = 'ACTIVE'`,
      [userId],
    );
    return courses.map((c: any) => ({
      ...c,
      id: Number(c.id),
      progress: Number(c.progress),
    }));
  }

  async getMyPayments(userId: number) {
    const payments = await this.dataSource.query(
      `SELECT MaHD as id, NgayLap as date, TongTien as amount, TrangThaiThanhToan as status
       FROM HoaDon
       WHERE MaND = ?
       ORDER BY NgayLap DESC`,
      [userId],
    );
    return payments.map((p: any) => {
      const d = new Date(p.date);
      return {
        id: `INV-${p.id}`,
        MaHD: p.id,
        date: d.toISOString().split('T')[0],
        amount: Number(p.amount),
        status:
          p.status === 'PAID'
            ? 'Success'
            : p.status === 'CANCELED'
              ? 'Canceled'
              : p.status === 'FAILED'
                ? 'Failed'
                : 'Pending',
      };
    });
  }

  async markLessonComplete(userId: number, lessonId: number) {
    const existing = await this.dataSource.query(
      `SELECT MaTienDo FROM TienDoHocTap WHERE MaND = ? AND MaBH = ?`,
      [userId, lessonId],
    );

    if (existing.length > 0) {
      await this.dataSource.query(
        `UPDATE TienDoHocTap SET DaHoanThanh = 1, LanXemCuoi = NOW() WHERE MaTienDo = ?`,
        [existing[0].MaTienDo],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO TienDoHocTap (MaND, MaBH, DaHoanThanh, LanXemCuoi) VALUES (?, ?, 1, NOW())`,
        [userId, lessonId],
      );
    }

    return { success: true };
  }

  async getMyProgress(userId: number) {
    const progress = await this.dataSource.query(
      `SELECT MaBH FROM TienDoHocTap WHERE MaND = ? AND DaHoanThanh = 1`,
      [userId],
    );
    return progress.map((p: any) => p.MaBH);
  }

  // ─── Lưu bài học gần nhất đang xem ─────────────────────────────────────────
  async updateCurrentLesson(
    userId: number,
    courseId: number,
    lessonId: number,
  ) {
    console.log(
      `[updateCurrentLesson] userId=${userId} | courseId=${courseId} | lessonId=${lessonId}`,
    );
    await this.dataSource.query(
      `UPDATE DangKyKhoaHoc SET MaBaiHocGanNhat = ? WHERE MaND = ? AND MaKH = ? AND TrangThai = 'ACTIVE'`,
      [lessonId, userId, courseId],
    );
    return { success: true, lessonId };
  }

  // ─── Lấy bài học gần nhất của học viên trong khóa học ─────────────────────
  async getCourseLastLesson(userId: number, courseId: number) {
    console.log(
      `[getCourseLastLesson] userId=${userId} | courseId=${courseId}`,
    );
    const rows = await this.dataSource.query(
      `SELECT MaBaiHocGanNhat as lastLessonId FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH = ? AND TrangThai = 'ACTIVE' LIMIT 1`,
      [userId, courseId],
    );
    if (rows.length === 0) return { lastLessonId: null };
    return {
      lastLessonId: rows[0].lastLessonId ? Number(rows[0].lastLessonId) : null,
    };
  }
}
