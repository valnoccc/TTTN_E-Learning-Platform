import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { KhoaHoc } from '../entities/course.entity';

type CourseLessonRow = {
  maBH?: number | string;
  tenBaiHoc?: string | null;
  videoURL?: string | null;
  thuTu?: number | string | null;
  aiStatus?: string | null;
  aiRejectReason?: string | null;
};

@Injectable()
export class CoursesService implements OnModuleInit {
  private courseSchemaReady: Promise<void> | null = null;

  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async onModuleInit() {
    await this.ensureCourseSchema();
  }

  private ensureCourseSchema() {
    if (!this.courseSchemaReady) {
      this.courseSchemaReady = (async () => {
        await this.dataSource.query(
          `ALTER TABLE \`KhoaHoc\`
           ADD COLUMN IF NOT EXISTS \`NgayCapNhat\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER \`YeuCauKhoaHoc\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`KhoaHoc\`
           MODIFY COLUMN \`NgayCapNhat\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
        );
      })();
    }

    return this.courseSchemaReady;
  }

  async getCoursesByInstructor(instructorId: number) {
    return await this.khoaHocRepository.find({
      where: { maND_GiangVien: instructorId },
      order: { maKH: 'DESC' },
    });
  }

  async createCourse(payload: any, mucTieu: string[], yeuCau: string[]) {
    const newCourse = this.khoaHocRepository.create({
      ...payload,
      ngayCapNhat: new Date(),
    });
    const savedCourse = await this.khoaHocRepository.save(newCourse);
    const courseId = (savedCourse as any).maKH;

    if (mucTieu && mucTieu.length > 0) {
      for (const noiDung of mucTieu) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO MucTieuKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    if (yeuCau && yeuCau.length > 0) {
      for (const noiDung of yeuCau) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO YeuCauKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    return savedCourse;
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền xóa khóa học này');
    }

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ChiTietHoaDon WHERE MaKH = ?`,
      [courseId],
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, {
        trangThai: 'DRAFT',
        ngayCapNhat: new Date(),
      });
      return {
        message:
          'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẩn.',
      };
    }

    // Xóa các bảng phụ thuộc trước để tránh lỗi Foreign Key Constraint
    // 1. Mục tiêu và Yêu cầu
    await this.dataSource.query(`DELETE FROM MucTieuKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);
    await this.dataSource.query(`DELETE FROM YeuCauKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // 2. Thảo luận (xóa con trước rồi xóa cha)
    await this.dataSource.query(
      `DELETE FROM ThaoLuanKhoaHoc WHERE MaThaoLuanCha IN (
         SELECT MaThaoLuan FROM (SELECT MaThaoLuan FROM ThaoLuanKhoaHoc WHERE MaKH = ?) AS temp
       )`,
      [courseId],
    );
    await this.dataSource.query(`DELETE FROM ThaoLuanKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // 3. Đánh giá
    await this.dataSource.query(
      `DELETE FROM DanhGiaKhoaHoc WHERE MaDanhGiaCha IN (
         SELECT MaDanhGia FROM (SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaKH = ?) AS temp
       )`,
      [courseId],
    );
    await this.dataSource.query(`DELETE FROM DanhGiaKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // 4. Đăng ký & Tiến độ
    await this.dataSource.query(`DELETE FROM DangKyKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);
    await this.dataSource.query(
      `DELETE FROM TienDoHocTap WHERE MaBH IN (SELECT MaBH FROM BaiHoc WHERE MaKH = ?)`,
      [courseId],
    );

    // 5. Bài học và Chương học
    await this.dataSource.query(`DELETE FROM BaiHoc WHERE MaKH = ?`, [
      courseId,
    ]);
    await this.dataSource.query(`DELETE FROM ChuongHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // Cuối cùng mới xóa khóa học
    await this.khoaHocRepository.delete(courseId);
    return { message: 'Đã xóa khóa học thành công.' };
  }

  async updateCourseStatus(
    courseId: number,
    instructorId: number,
    trangThai: string,
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
    }

    if (trangThai === 'PENDING') {
      const lessons: CourseLessonRow[] = await this.dataSource.query(
        `SELECT MaBH AS maBH, TenBaiHoc AS tenBaiHoc, VideoURL AS videoURL, ThuTu AS thuTu, AiStatus AS aiStatus, AiRejectReason AS aiRejectReason
         FROM BaiHoc
         WHERE MaKH = ? AND VideoURL IS NOT NULL AND VideoURL <> ''
         ORDER BY ThuTu ASC, MaBH ASC`,
        [courseId],
      );

      if (lessons.length === 0) {
        throw new BadRequestException(
          'Khóa học chưa có video để gửi duyệt. Vui lòng thêm ít nhất 1 bài học có video.',
        );
      }

      const notApprovedLessons = lessons.filter(
        (lesson) => lesson.aiStatus !== 'APPROVED',
      );

      if (notApprovedLessons.length > 0) {
        const details = notApprovedLessons
          .map((lesson) => {
            const lessonTitle = lesson.tenBaiHoc?.trim() || `Bài ${lesson.maBH}`;
            const status = lesson.aiStatus || 'CHƯA KIỂM DUYỆT';
            const reason = lesson.aiRejectReason || 'Đang chờ AI xử lý hoặc cần xem xét lại';
            return `- ${lessonTitle}: ${status} - ${reason}`;
          })
          .join('\n');

        throw new BadRequestException(
          `Khóa học chỉ có thể gửi duyệt khi 100% video đã được AI duyệt.\n${details}`,
        );
      }
    }

    await this.khoaHocRepository.update(courseId, {
      trangThai,
      ngayCapNhat: new Date(),
    });
    return { message: 'Cập nhật trạng thái thành công' };
  }

  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Không tìm thấy khóa học hoặc bạn không có quyền truy cập',
      );
    }

    const mucTieuData = await this.dataSource.query(
      `SELECT NoiDung FROM MucTieuKhoaHoc WHERE MaKH = ?`,
      [courseId],
    );
    const yeuCauData = await this.dataSource.query(
      `SELECT NoiDung FROM YeuCauKhoaHoc WHERE MaKH = ?`,
      [courseId],
    );

    return {
      ...course,
      muc_tieu: mucTieuData.map((item: any) => item.NoiDung),
      yeu_cau: yeuCauData.map((item: any) => item.NoiDung),
    };
  }

  async updateCourse(
    courseId: number,
    instructorId: number,
    payload: any,
    mucTieu: string[],
    yeuCau: string[],
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
    }

    const previousThumbnail = course.hinhThuNho;
    const nextThumbnail = payload.hinhThuNho;

    Object.assign(course, payload, { ngayCapNhat: new Date() });
    const updatedCourse = await this.khoaHocRepository.save(course);

    if (mucTieu !== undefined) {
      await this.dataSource.query(`DELETE FROM MucTieuKhoaHoc WHERE MaKH = ?`, [
        courseId,
      ]);
      for (const noiDung of mucTieu) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO MucTieuKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    if (yeuCau !== undefined) {
      await this.dataSource.query(`DELETE FROM YeuCauKhoaHoc WHERE MaKH = ?`, [
        courseId,
      ]);
      for (const noiDung of yeuCau) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO YeuCauKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    if (
      previousThumbnail &&
      nextThumbnail &&
      previousThumbnail !== nextThumbnail
    ) {
      const oldPublicId =
        this.cloudinaryService.extractPublicId(previousThumbnail);
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(oldPublicId, 'image');
      }
    }

    return updatedCourse;
  }

  /**
   * Tính toán tổng số lượng khóa học và tổng số học viên của một giảng viên
   * Xử lý trường hợp dữ liệu rỗng và đảm bảo tính thống nhất của logic đếm.
   */
  async getInstructorStats(
    instructorId: number,
  ): Promise<{ totalCourses: number; totalStudents: number }> {
    // Tính tổng số khóa học (bao gồm cả đang chờ duyệt và đã duyệt)
    const totalCoursesResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM KhoaHoc WHERE MaND_GiangVien = ? AND TrangThai IN ('PUBLISHED', 'PENDING')`,
      [instructorId],
    );
    const totalCourses =
      totalCoursesResult.length > 0
        ? Number(totalCoursesResult[0].total || 0)
        : 0;

    // Tính tổng số học viên (unique) đăng ký tất cả khóa học của giảng viên
    // Đảm bảo chỉ đếm các giao dịch ACTIVE
    const totalStudentsResult = await this.dataSource.query(
      `SELECT COUNT(DISTINCT dk.MaND) as total 
       FROM DangKyKhoaHoc dk 
       JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH 
       WHERE kh.MaND_GiangVien = ? AND dk.TrangThai = 'ACTIVE'`,
      [instructorId],
    );
    const totalStudents =
      totalStudentsResult.length > 0
        ? Number(totalStudentsResult[0].total || 0)
        : 0;

    return { totalCourses, totalStudents };
  }

  /**
   * Tính toán tổng số lượng học viên đã đăng ký thành công một khóa học cụ thể
   */
  async getCourseTotalStudents(courseId: number): Promise<number> {
    const courseStudentsResult = await this.dataSource.query(
      `SELECT COUNT(DISTINCT MaND) as total 
       FROM DangKyKhoaHoc 
       WHERE MaKH = ? AND TrangThai = 'ACTIVE'`,
      [courseId],
    );
    return courseStudentsResult.length > 0
      ? Number(courseStudentsResult[0].total || 0)
      : 0;
  }
}
