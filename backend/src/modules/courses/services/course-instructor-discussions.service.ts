import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateDiscussionReplyDto } from '../dto/create-discussion-reply.dto';
import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CourseInstructorDiscussionsService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getCourseDiscussions(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Báº¡n khÃ´ng cÃ³ quyá»n xem tháº£o luáº­n cá»§a khÃ³a há»c nÃ y',
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
        'Báº¡n khÃ´ng cÃ³ quyá»n thao tÃ¡c trÃªn khÃ³a há»c nÃ y',
      );
    }

    const parentDiscussion = await this.dataSource.query(
      `SELECT MaThaoLuan FROM ThaoLuanKhoaHoc WHERE MaThaoLuan = ? AND MaKH = ?`,
      [payload.parentId, courseId],
    );

    if (parentDiscussion.length === 0) {
      throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y cuá»™c tháº£o luáº­n gá»‘c há»£p lá»‡');
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
      userName: course.giangVien?.hoTen || 'Giáº£ng viÃªn',
      userAvatar: course.giangVien?.anhDaiDien || null,
      userRole: 'INSTRUCTOR',
    };
  }
}
