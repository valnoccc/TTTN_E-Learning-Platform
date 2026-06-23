import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';
import { CreateDiscussionReplyDto } from '../dto/create-discussion-reply.dto';

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getInstructorDiscussions(instructorId: number) {
    return await this.dataSource.query(
      `
      SELECT
        tl.MaThaoLuan AS discussionId,
        tl.NoiDung AS content,
        tl.ThoiGian AS createdAt,
        tl.MaThaoLuanCha AS parentId,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar,
        u.VaiTro AS userRole,
        kh.MaKH AS courseId,
        kh.TenKhoaHoc AS courseTitle
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE kh.MaND_GiangVien = ?
      ORDER BY tl.ThoiGian DESC
      `,
      [instructorId],
    );
  }

  async getCourseDiscussions(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thảo luận của khóa học này',
      );
    }

    return await this.dataSource.query(
      `
      SELECT
        tl.MaThaoLuan AS discussionId,
        tl.NoiDung AS content,
        tl.ThoiGian AS createdAt,
        tl.MaThaoLuanCha AS parentId,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar,
        u.VaiTro AS userRole
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE tl.MaKH = ?
      ORDER BY tl.ThoiGian DESC
      `,
      [courseId],
    );
  }

  async replyToDiscussion(
    courseId: number,
    instructorId: number,
    payload: CreateDiscussionReplyDto,
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

    const parentDiscussion = await this.dataSource.query(
      `SELECT MaThaoLuan FROM ThaoLuanKhoaHoc WHERE MaThaoLuan = ? AND MaKH = ?`,
      [payload.parentId, courseId],
    );

    if (parentDiscussion.length === 0) {
      throw new BadRequestException('Không tìm thấy cuộc thảo luận gốc hợp lệ');
    }

    const result = await this.dataSource.query(
      `INSERT INTO ThaoLuanKhoaHoc (MaKH, MaND, NoiDung, ThoiGian, MaThaoLuanCha)
       VALUES (?, ?, ?, NOW(), ?)`,
      [courseId, instructorId, payload.noiDung, payload.parentId],
    );

    return {
      discussionId: result.insertId,
      content: payload.noiDung,
      createdAt: new Date().toISOString(),
      parentId: payload.parentId,
      userId: instructorId,
      userName: course.giangVien?.hoTen || 'Giảng viên',
      userAvatar: course.giangVien?.anhDaiDien || null,
      userRole: 'INSTRUCTOR',
      courseId,
      courseTitle: course.tenKhoaHoc,
    };
  }

  /**
   * Lấy danh sách thảo luận công khai của khóa học (không yêu cầu quyền INSTRUCTOR)
   * Dùng cho học viên xem và đặt câu hỏi
   */
  async getPublicCourseDiscussions(courseId: number) {
    return await this.dataSource.query(
      `
      SELECT
        tl.MaThaoLuan AS discussionId,
        tl.NoiDung AS content,
        tl.ThoiGian AS createdAt,
        tl.MaThaoLuanCha AS parentId,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar,
        u.VaiTro AS userRole
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE tl.MaKH = ?
        AND tl.MaThaoLuanCha IS NULL
      ORDER BY tl.ThoiGian DESC
      `,
      [courseId],
    );
  }

  /**
   * Học viên đăng câu hỏi mới (không cần là giảng viên của khóa học)
   * Yêu cầu: user đã đăng nhập
   */
  async createStudentDiscussion(
    courseId: number,
    userId: number,
    noiDung: string,
  ) {
    // Kiểm tra khóa học tồn tại
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId },
    });

    if (!course) {
      throw new BadRequestException('Khóa học không tồn tại');
    }

    const result = await this.dataSource.query(
      `INSERT INTO ThaoLuanKhoaHoc (MaKH, MaND, NoiDung, ThoiGian, MaThaoLuanCha)
       VALUES (?, ?, ?, NOW(), NULL)`,
      [courseId, userId, noiDung],
    );

    const user = await this.dataSource.query(
      `SELECT HoTen, AnhDaiDien, VaiTro FROM NguoiDung WHERE MaND = ?`,
      [userId],
    );

    return {
      discussionId: result.insertId,
      content: noiDung,
      createdAt: new Date().toISOString(),
      parentId: null,
      userId,
      userName: user[0]?.HoTen || 'Học viên',
      userAvatar: user[0]?.AnhDaiDien || null,
      userRole: user[0]?.VaiTro || 'STUDENT',
      courseId,
    };
  }
}
