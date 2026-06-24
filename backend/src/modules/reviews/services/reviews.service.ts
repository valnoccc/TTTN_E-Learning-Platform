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

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getInstructorReviews(instructorId: number) {
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
        u.AnhDaiDien AS studentAvatar,
        kh.MaKH AS courseId,
        kh.TenKhoaHoc AS courseTitle
      FROM DanhGiaKhoaHoc dg
      INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
      INNER JOIN NguoiDung u ON dg.MaND = u.MaND
      WHERE kh.MaND_GiangVien = ?
      ORDER BY dg.ThoiGian DESC
      `,
      [instructorId],
    );
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

  async getPublicCourseReviews(courseId: number) {
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
      throw new BadRequestException('Khóa học không tồn tại hoặc chưa được xuất bản!');
    }

    // Check if the student has enrolled in the course
    const enrollment = await this.dataSource.query(
      `SELECT MaDangKy FROM DangKyKhoaHoc WHERE MaKH = ? AND MaND = ? AND TrangThai = 'ACTIVE'`,
      [courseId, studentId]
    );

    if (enrollment.length === 0) {
      throw new ForbiddenException('Bạn cần đăng ký khóa học để thực hiện nhận xét');
    }

    // Check if the student has already reviewed this course
    const existingReview = await this.dataSource.query(
      `SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaKH = ? AND MaND = ? AND MaDanhGiaCha IS NULL`,
      [courseId, studentId]
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
      [studentId]
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
