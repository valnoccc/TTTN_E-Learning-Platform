import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateReplyDto } from '../dto/create-reply.dto';
import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CourseInstructorReviewsService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getCourseReviews(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền xem đánh giá của khóa học này',
      );
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
        'Bạn không có quyền thao tác trên khóa học này',
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
    };
  }
}
