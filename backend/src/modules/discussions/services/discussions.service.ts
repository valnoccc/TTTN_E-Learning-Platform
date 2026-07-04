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
        tl.IsHidden AS isHidden,
        tl.IsDeleted AS isDeleted,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar,
        u.VaiTro AS userRole,
        kh.MaKH AS courseId,
        kh.TenKhoaHoc AS courseTitle,
        (SELECT COUNT(*) FROM BaoCaoViPham bc WHERE bc.MaThaoLuan = tl.MaThaoLuan AND bc.TrangThai = 'PENDING') AS reportCount
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE kh.MaND_GiangVien = ?
        AND tl.IsDeleted = FALSE
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
        tl.IsHidden AS isHidden,
        tl.IsDeleted AS isDeleted,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar,
        u.VaiTro AS userRole,
        (SELECT COUNT(*) FROM BaoCaoViPham bc WHERE bc.MaThaoLuan = tl.MaThaoLuan AND bc.TrangThai = 'PENDING') AS reportCount
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE tl.MaKH = ?
        AND tl.IsDeleted = FALSE
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
   * Lấy danh sách thảo luận công khai (chỉ hiện bài không ẩn và không xóa)
   */
  async getPublicCourseDiscussions(courseId: number) {
    const rawData = await this.dataSource.query(
      `
      SELECT
        tl.MaThaoLuan AS discussionId,
        tl.NoiDung AS content,
        tl.ThoiGian AS createdAt,
        tl.MaThaoLuanCha AS parentId,
        tl.IsHidden AS isHidden,
        tl.IsDeleted AS isDeleted,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar,
        u.VaiTro AS userRole,
        (SELECT COUNT(*) FROM ThaoLuan_LuotThich WHERE MaThaoLuan = tl.MaThaoLuan) AS upvotes,
        (SELECT GROUP_CONCAT(MaND) FROM ThaoLuan_LuotThich WHERE MaThaoLuan = tl.MaThaoLuan) AS likedUserIds
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE tl.MaKH = ?
        AND tl.IsHidden = FALSE
        AND tl.IsDeleted = FALSE
      ORDER BY tl.ThoiGian ASC
      `,
      [courseId],
    );

    const processDiscussion = (d: any) => {
      d.upvotes = parseInt(d.upvotes, 10) || 0;
      d.likedUserIds = d.likedUserIds ? d.likedUserIds.split(',').map(Number) : [];
      d.isHidden = Boolean(d.isHidden);
      d.isDeleted = Boolean(d.isDeleted);
      return d;
    };

    const parents = rawData
      .filter((d: any) => !d.parentId)
      .map(processDiscussion);
    const replies = rawData
      .filter((d: any) => d.parentId)
      .map(processDiscussion);

    const result = parents.map((p: any) => {
      const pReplies = replies.filter(
        (r: any) => r.parentId === p.discussionId,
      );

      return {
        ...p,
        replies: pReplies.sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      };
    });

    return result.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async toggleLikeDiscussion(discussionId: number, userId: number) {
    const existingLike = await this.dataSource.query(
      `SELECT * FROM ThaoLuan_LuotThich WHERE MaThaoLuan = ? AND MaND = ?`,
      [discussionId, userId],
    );

    let isLiked = false;
    if (existingLike.length > 0) {
      await this.dataSource.query(
        `DELETE FROM ThaoLuan_LuotThich WHERE MaThaoLuan = ? AND MaND = ?`,
        [discussionId, userId],
      );
      isLiked = false;
    } else {
      await this.dataSource.query(
        `INSERT INTO ThaoLuan_LuotThich (MaThaoLuan, MaND) VALUES (?, ?)`,
        [discussionId, userId],
      );
      isLiked = true;
    }

    const countRes = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ThaoLuan_LuotThich WHERE MaThaoLuan = ?`,
      [discussionId],
    );

    return {
      discussionId,
      isLiked,
      upvotes: parseInt(countRes[0].count, 10),
    };
  }

  /**
   * Học viên đăng câu hỏi mới (không yêu cầu là giảng viên)
   */
  async createStudentDiscussion(
    courseId: number,
    userId: number,
    noiDung: string,
    parentId?: number,
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId },
    });

    if (!course) {
      throw new BadRequestException('Khóa học không tồn tại');
    }

    const result = await this.dataSource.query(
      `INSERT INTO ThaoLuanKhoaHoc (MaKH, MaND, NoiDung, ThoiGian, MaThaoLuanCha)
       VALUES (?, ?, ?, NOW(), ?)`,
      [courseId, userId, noiDung, parentId || null],
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

  /**
   * Ẩn thảo luận theo RBAC:
   * - ADMIN → toàn quyền
   * - INSTRUCTOR → chỉ trong khóa học mình dạy
   * - USER → không có quyền
   */
  async hideDiscussion(
    discussionId: number,
    requesterId: number,
    requesterRole: string,
  ) {
    if (requesterRole === 'ADMIN') {
      await this.dataSource.query(
        `UPDATE ThaoLuanKhoaHoc SET IsHidden = TRUE WHERE MaThaoLuan = ?`,
        [discussionId],
      );
      return { hidden: true };
    }

    if (requesterRole === 'INSTRUCTOR') {
      const check = await this.dataSource.query(
        `
        SELECT tl.MaThaoLuan
        FROM ThaoLuanKhoaHoc tl
        INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
        WHERE tl.MaThaoLuan = ? AND kh.MaND_GiangVien = ?
        `,
        [discussionId, requesterId],
      );

      if (check.length === 0) {
        throw new ForbiddenException(
          'Bạn không có quyền ẩn bình luận này (không thuộc khóa học của bạn)',
        );
      }

      await this.dataSource.query(
        `UPDATE ThaoLuanKhoaHoc SET IsHidden = TRUE WHERE MaThaoLuan = ?`,
        [discussionId],
      );
      return { hidden: true };
    }

    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
  }

  /**
   * Xóa mềm thảo luận theo RBAC:
   * - ADMIN → toàn quyền
   * - INSTRUCTOR → chỉ trong khóa học mình dạy
   * - USER → chỉ bài chính mình viết
   */
  async deleteDiscussion(
    discussionId: number,
    requesterId: number,
    requesterRole: string,
  ) {
    if (requesterRole === 'ADMIN') {
      await this.dataSource.query(
        `UPDATE ThaoLuanKhoaHoc SET IsDeleted = TRUE WHERE MaThaoLuan = ?`,
        [discussionId],
      );
      return { deleted: true };
    }

    if (requesterRole === 'INSTRUCTOR') {
      const check = await this.dataSource.query(
        `
        SELECT tl.MaThaoLuan
        FROM ThaoLuanKhoaHoc tl
        INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
        WHERE tl.MaThaoLuan = ? AND kh.MaND_GiangVien = ?
        `,
        [discussionId, requesterId],
      );

      if (check.length === 0) {
        throw new ForbiddenException(
          'Bạn không có quyền xóa bình luận này (không thuộc khóa học của bạn)',
        );
      }

      await this.dataSource.query(
        `UPDATE ThaoLuanKhoaHoc SET IsDeleted = TRUE WHERE MaThaoLuan = ?`,
        [discussionId],
      );
      return { deleted: true };
    }

    // USER: chỉ xóa bài do chính mình viết
    const own = await this.dataSource.query(
      `SELECT MaThaoLuan FROM ThaoLuanKhoaHoc WHERE MaThaoLuan = ? AND MaND = ?`,
      [discussionId, requesterId],
    );

    if (own.length === 0) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.dataSource.query(
      `UPDATE ThaoLuanKhoaHoc SET IsDeleted = TRUE WHERE MaThaoLuan = ?`,
      [discussionId],
    );
    return { deleted: true };
  }

  async deleteOwnDiscussion(discussionId: number, instructorId: number) {
    const ownedDiscussion = await this.dataSource.query(
      `
      SELECT tl.MaThaoLuan
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
      WHERE tl.MaThaoLuan = ?
        AND tl.MaND = ?
        AND kh.MaND_GiangVien = ?
      `,
      [discussionId, instructorId, instructorId],
    );

    if (ownedDiscussion.length === 0) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.dataSource.query(
      `UPDATE ThaoLuanKhoaHoc SET IsDeleted = TRUE WHERE MaThaoLuan = ?`,
      [discussionId],
    );

    return { deleted: true };
  }

  async rejectDiscussionReports(discussionId: number, instructorId: number) {
    const ownedDiscussion = await this.dataSource.query(
      `
      SELECT tl.MaThaoLuan
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
      WHERE tl.MaThaoLuan = ?
        AND kh.MaND_GiangVien = ?
      `,
      [discussionId, instructorId],
    );

    if (ownedDiscussion.length === 0) {
      throw new ForbiddenException('Bạn không có quyền xử lý báo cáo của khóa học này');
    }

    await this.dataSource.query(
      `UPDATE BaoCaoViPham SET TrangThai = 'REJECTED' WHERE MaThaoLuan = ? AND TrangThai = 'PENDING'`,
      [discussionId],
    );

    return { rejected: true };
  }
}
