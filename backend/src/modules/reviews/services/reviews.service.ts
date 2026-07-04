import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateReplyDto } from '../../courses/dto/create-reply.dto';
import { CreateStudentReviewDto } from '../dto/create-student-review.dto';
import { KhoaHoc } from '../../courses/entities/course.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getInstructorReviews(instructorId: number) {
    const rawResults = await this.dataSource.query(
      `
      SELECT 
        dg.MaDanhGia AS reviewId,
        dg.SoSao AS rating,
        dg.NoiDung AS content,
        dg.ThoiGian AS createdAt,
        dg.MaDanhGiaCha AS parentId,
        u.MaND AS studentId,
        u.HoTen AS studentName,
        u.AnhDaiDien AS studentAvatar,
        kh.MaKH AS courseId,
        kh.TenKhoaHoc AS courseTitle,
        (CASE WHEN EXISTS(SELECT 1 FROM DanhGiaBaoCao bc WHERE bc.MaDG = dg.MaDanhGia) THEN 1 ELSE 0 END) AS isReported,
        (SELECT LyDo FROM DanhGiaBaoCao bc WHERE bc.MaDG = dg.MaDanhGia LIMIT 1) AS reportReason
      FROM DanhGiaKhoaHoc dg
      INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
      INNER JOIN NguoiDung u ON dg.MaND = u.MaND
      WHERE kh.MaND_GiangVien = ?
      ORDER BY dg.ThoiGian DESC
      `,
      [instructorId],
    );

    return rawResults.map((row: any) => ({
      ...row,
      isReported: Boolean(Number(row.isReported || 0)),
    }));
  }

  async getCourseReviews(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Khóa học không tồn tại!');
    }

    return await this.dataSource.query(
      `
      SELECT 
        dg.MaDanhGia AS reviewId,
        dg.SoSao AS rating,
        dg.NoiDung AS content,
        dg.ThoiGian AS createdAt,
        dg.MaDanhGiaCha AS parentId,
        u.MaND AS studentId,
        u.HoTen AS studentName,
        u.AnhDaiDien AS studentAvatar
      FROM DanhGiaKhoaHoc dg
      INNER JOIN NguoiDung u ON dg.MaND = u.MaND
      WHERE dg.MaKH = ?
      ORDER BY dg.ThoiGian DESC
      `,
      [courseId],
    );
  }

  async replyToReview(
    courseId: number,
    instructorId: number,
    payload: CreateReplyDto,
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
      relations: ['giangVien'],
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên khóa học này!',
      );
    }

    const parentReview = await this.dataSource.query(
      `SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaDanhGia = ? AND MaKH = ?`,
      [payload.parentId, courseId],
    );

    if (parentReview.length === 0) {
      throw new BadRequestException('Không tìm thấy đánh giá gốc hợp lệ');
    }

    const result = await this.dataSource.query(
      `INSERT INTO DanhGiaKhoaHoc (MaKH, MaND, SoSao, NoiDung, ThoiGian, MaDanhGiaCha) 
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [courseId, instructorId, 0, payload.noiDung, payload.parentId],
    );

    return {
      reviewId: result.insertId,
      rating: 0,
      content: payload.noiDung,
      createdAt: new Date().toISOString(),
      parentId: payload.parentId,
      studentId: instructorId,
      studentName: course.giangVien?.hoTen || 'Giảng viên',
      studentAvatar: course.giangVien?.anhDaiDien || null,
      courseId,
      courseTitle: course.tenKhoaHoc,
    };
  }

  async deleteOwnReview(reviewId: number, instructorId: number) {
    const ownedReview = await this.dataSource.query(
      `
      SELECT dg.MaDanhGia
      FROM DanhGiaKhoaHoc dg
      INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
      WHERE dg.MaDanhGia = ?
        AND dg.MaND = ?
        AND kh.MaND_GiangVien = ?
      `,
      [reviewId, instructorId, instructorId],
    );

    if (ownedReview.length === 0) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.dataSource.query(
      `DELETE FROM DanhGiaKhoaHoc WHERE MaDanhGia = ?`,
      [reviewId],
    );

    return { deleted: true };
  }

  async getPublicCourseReviews(
    courseId: number,
    tuKhoa?: string,
    soSao?: number,
    userId?: number,
  ) {
    const allReviews = await this.dataSource.query(
      `
      SELECT 
        dg.MaDanhGia    AS reviewId,
        dg.SoSao        AS rating,
        dg.NoiDung      AS content,
        dg.ThoiGian     AS createdAt,
        dg.MaDanhGiaCha AS parentId,
        u.MaND          AS studentId,
        u.HoTen         AS studentName,
        u.AnhDaiDien    AS studentAvatar,
        (SELECT COUNT(*) FROM DanhGiaHuuIch WHERE MaDG = dg.MaDanhGia AND TrangThai = 1) AS helpfulCount,
        (SELECT COUNT(*) FROM DanhGiaHuuIch WHERE MaDG = dg.MaDanhGia AND TrangThai = -1) AS notHelpfulCount
        ${userId ? `, (SELECT TrangThai FROM DanhGiaHuuIch WHERE MaDG = dg.MaDanhGia AND MaND = ${Number(userId)}) AS userVote` : ''}
      FROM DanhGiaKhoaHoc dg
      INNER JOIN NguoiDung u ON dg.MaND = u.MaND
      WHERE dg.MaKH = ?
      ORDER BY dg.ThoiGian ASC
      `,
      [courseId],
    );

    let rootReviews = allReviews.filter(
      (r: any) =>
        !r.parentId || r.parentId === null || Number(r.parentId) === 0,
    );

    const replies = allReviews.filter(
      (r: any) => r.parentId && Number(r.parentId) !== 0,
    );

    // Mới nhất lên đầu
    rootReviews.reverse();

    // Lọc bằng Javascript để xử lý an toàn
    if (soSao && soSao > 0) {
      rootReviews = rootReviews.filter(
        (r: any) => Number(r.rating) === Number(soSao),
      );
    }

    if (tuKhoa) {
      const keyword = tuKhoa.toLowerCase();
      rootReviews = rootReviews.filter(
        (r: any) => r.content && r.content.toLowerCase().includes(keyword),
      );
    }

    rootReviews.forEach((root: any) => {
      root.helpfulCount = Number(root.helpfulCount || 0);
      root.notHelpfulCount = Number(root.notHelpfulCount || 0);
      root.userVote = Number(root.userVote || 0);

      root.replies = replies.filter(
        (r: any) => Number(r.parentId) === Number(root.reviewId),
      );
    });

    return rootReviews;
  }

  async voteReview(reviewId: number, userId: number, trangThai: number) {
    if (trangThai !== 1 && trangThai !== -1) {
      // Huỷ vote
      await this.dataSource.query(
        `DELETE FROM DanhGiaHuuIch WHERE MaDG = ? AND MaND = ?`,
        [reviewId, userId],
      );
      return { action: 'removed' };
    }

    const existing = await this.dataSource.query(
      `SELECT TrangThai FROM DanhGiaHuuIch WHERE MaDG = ? AND MaND = ?`,
      [reviewId, userId],
    );

    if (existing.length > 0) {
      if (existing[0].TrangThai === trangThai) {
        // Same vote, toggle it off
        await this.dataSource.query(
          `DELETE FROM DanhGiaHuuIch WHERE MaDG = ? AND MaND = ?`,
          [reviewId, userId],
        );
        return { action: 'removed' };
      } else {
        // Update vote
        await this.dataSource.query(
          `UPDATE DanhGiaHuuIch SET TrangThai = ? WHERE MaDG = ? AND MaND = ?`,
          [trangThai, reviewId, userId],
        );
        return { action: 'updated', trangThai };
      }
    } else {
      // Insert new vote
      await this.dataSource.query(
        `INSERT INTO DanhGiaHuuIch (MaDG, MaND, TrangThai) VALUES (?, ?, ?)`,
        [reviewId, userId, trangThai],
      );
      return { action: 'added', trangThai };
    }
  }

  async reportReview(reviewId: number, userId: number, lyDo: string) {
    const existing = await this.dataSource.query(
      `SELECT MaDG FROM DanhGiaBaoCao WHERE MaDG = ? AND MaND = ?`,
      [reviewId, userId],
    );
    if (existing.length > 0) {
      throw new BadRequestException('Bạn đã báo cáo đánh giá này rồi.');
    }

    await this.dataSource.query(
      `INSERT INTO DanhGiaBaoCao (MaDG, MaND, LyDo) VALUES (?, ?, ?)`,
      [reviewId, userId, lyDo],
    );

    // Thông báo cho giảng viên
    try {
      const courseInfo = await this.dataSource.query(
        `SELECT kh.MaND_GiangVien, kh.TenKhoaHoc, u.HoTen AS ReporterName, dg.NoiDung
         FROM DanhGiaKhoaHoc dg
         INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
         INNER JOIN NguoiDung u ON u.MaND = ?
         WHERE dg.MaDanhGia = ?`,
        [userId, reviewId],
      );

      if (courseInfo && courseInfo.length > 0) {
        const info = courseInfo[0];
        const noiDungNgan = info.NoiDung
          ? info.NoiDung.length > 30
            ? info.NoiDung.substring(0, 30) + '...'
            : info.NoiDung
          : 'Không có nội dung';

        await this.notificationsService.createNotification({
          maND: info.MaND_GiangVien,
          maNguoiGui: userId,
          loaiThongBao: NotificationType.COURSE,
          tieuDe: 'Đánh giá khóa học bị báo cáo',
          noiDung: `Học viên ${info.ReporterName} đã báo cáo một đánh giá ("${noiDungNgan}") trong khóa học "${info.TenKhoaHoc}" với lý do: ${lyDo}`,
        });
      }
    } catch (error) {
      console.error('Error sending report notification:', error);
    }

    return true;
  }

  async createStudentReview(
    courseId: number,
    studentId: number,
    payload: CreateStudentReviewDto,
  ) {
    // Check if course exists and is published
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, trangThai: 'PUBLISHED' },
    });

    if (!course) {
      throw new BadRequestException(
        'Khóa học không tồn tại hoặc chưa được xuất bản!',
      );
    }

    // Check if the student has enrolled in the course
    const enrollment = await this.dataSource.query(
      `SELECT MaDangKy FROM DangKyKhoaHoc WHERE MaKH = ? AND MaND = ? AND TrangThai = 'ACTIVE'`,
      [courseId, studentId],
    );

    if (enrollment.length === 0) {
      throw new ForbiddenException(
        'Bạn cần đăng ký khóa học để thực hiện nhận xét',
      );
    }

    // Check if the student has already reviewed this course
    const existingReview = await this.dataSource.query(
      `SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaKH = ? AND MaND = ? AND MaDanhGiaCha IS NULL`,
      [courseId, studentId],
    );

    if (existingReview.length > 0) {
      throw new BadRequestException('Bạn đã đánh giá khóa học này rồi!');
    }

    const result = await this.dataSource.query(
      `INSERT INTO DanhGiaKhoaHoc (MaKH, MaND, SoSao, NoiDung, ThoiGian, MaDanhGiaCha) 
       VALUES (?, ?, ?, ?, NOW(), NULL)`,
      [courseId, studentId, payload.soSao, payload.noiDung],
    );

    const user = await this.dataSource.query(
      `SELECT HoTen, AnhDaiDien FROM NguoiDung WHERE MaND = ?`,
      [studentId],
    );

    return {
      reviewId: result.insertId,
      rating: payload.soSao,
      content: payload.noiDung,
      createdAt: new Date().toISOString(),
      parentId: null,
      studentId: studentId,
      studentName: user[0]?.HoTen || 'Học viên',
      studentAvatar: user[0]?.AnhDaiDien || null,
      courseId,
    };
  }
}
