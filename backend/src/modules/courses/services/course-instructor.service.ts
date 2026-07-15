import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { KhoaHoc } from '../entities/course.entity';

type CourseLessonRow = {
  maBH?: number | string;
  tenBaiHoc?: string | null;
  videoURL?: string | null;
  thuTu?: number | string | null;
  aiStatus?: string | null;
  aiRejectReason?: string | null;
};

const COURSE_REVIEW_THRESHOLD = 0.2;
const COURSE_AUTO_REJECT_THRESHOLD = 0.4;

@Injectable()
export class CoursesService implements OnModuleInit {
  private courseSchemaReady: Promise<void> | null = null;

  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly lessonVideoStorageService: LessonVideoStorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.ensureCourseSchema();
  }

  private ensureCourseSchema() {
    if (!this.courseSchemaReady) {
      this.courseSchemaReady = (async () => {
        await this.addColumnIfMissing(
          'KhoaHoc',
          'NgayCapNhat',
          'datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `YeuCauKhoaHoc`',
        );

        await this.dataSource.query(
          `ALTER TABLE \`KhoaHoc\`
           MODIFY COLUMN \`NgayCapNhat\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
        );
      })();
    }

    return this.courseSchemaReady;
  }

  private async addColumnIfMissing(
    tableName: string,
    columnName: string,
    definition: string,
  ) {
    if (await this.columnExists(tableName, columnName)) {
      return;
    }

    await this.dataSource.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`,
    );
  }

  private async columnExists(tableName: string, columnName: string) {
    const rows = await this.dataSource.query(
      `
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `,
      [tableName, columnName],
    );

    return Array.isArray(rows) && rows.length > 0;
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
      throw new ForbiddenException('B?n kh?ng c? quy?n x?a kh?a h?c n?y');
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
          'Kh?a h?c ?? c? h?c vi?n mua, h? th?ng ?? chuy?n sang tr?ng th?i ?n.',
      };
    }

    await this.deleteStoredCourseAssets(courseId, course.hinhThuNho ?? null);

    // Delete dependent tables before deleting the course to avoid FK errors
    // 1. Objectives and requirements
    await this.dataSource.query(`DELETE FROM MucTieuKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);
    await this.dataSource.query(`DELETE FROM YeuCauKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // 2. Discussions (delete children before parents)
    await this.dataSource.query(
      `DELETE FROM ThaoLuanKhoaHoc WHERE MaThaoLuanCha IN (
         SELECT MaThaoLuan FROM (SELECT MaThaoLuan FROM ThaoLuanKhoaHoc WHERE MaKH = ?) AS temp
       )`,
      [courseId],
    );
    await this.dataSource.query(`DELETE FROM ThaoLuanKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // 3. Reviews
    await this.dataSource.query(
      `DELETE FROM DanhGiaKhoaHoc WHERE MaDanhGiaCha IN (
         SELECT MaDanhGia FROM (SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaKH = ?) AS temp
       )`,
      [courseId],
    );
    await this.dataSource.query(`DELETE FROM DanhGiaKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // 4. Enrollments & progress
    await this.dataSource.query(`DELETE FROM DangKyKhoaHoc WHERE MaKH = ?`, [
      courseId,
    ]);
    await this.dataSource.query(
      `DELETE FROM TienDoHocTap WHERE MaBH IN (SELECT MaBH FROM BaiHoc WHERE MaKH = ?)`,
      [courseId],
    );

    // 5. Lessons and chapters
    await this.dataSource.query(`DELETE FROM BaiHoc WHERE MaKH = ?`, [
      courseId,
    ]);
    await this.dataSource.query(`DELETE FROM ChuongHoc WHERE MaKH = ?`, [
      courseId,
    ]);

    // Delete the course last
    await this.khoaHocRepository.delete(courseId);
    return { message: '?? x?a kh?a h?c th?nh c?ng.' };
  }

  private async deleteStoredCourseAssets(
    courseId: number,
    thumbnailUrl: string | null,
  ) {
    const lessonRows: Array<{
      maBH?: number | string;
      videoURL?: string | null;
    }> = await this.dataSource.query(
      `SELECT MaBH AS maBH, VideoURL AS videoURL
         FROM BaiHoc
         WHERE MaKH = ? AND VideoURL IS NOT NULL AND VideoURL <> ''`,
      [courseId],
    );

    await Promise.all(
      lessonRows.map(async (lesson) => {
        const videoUrl = lesson.videoURL?.trim();
        if (!videoUrl) return;
        await this.deleteStoredVideo(videoUrl);
      }),
    );

    if (thumbnailUrl?.trim() && thumbnailUrl.includes('cloudinary.com')) {
      const publicId = this.cloudinaryService.extractPublicId(thumbnailUrl);
      if (publicId) {
        try {
          await this.cloudinaryService.deleteFile(publicId, 'image');
        } catch (error) {
          console.error('Khong the xoa thumbnail khoa hoc:', error);
        }
      }
    }
  }

  private async deleteStoredVideo(videoUrl: string) {
    try {
      if (videoUrl.includes('cloudinary.com')) {
        const publicId = this.cloudinaryService.extractPublicId(videoUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId, 'video');
        }
        return;
      }

      await this.lessonVideoStorageService.deleteVideo(videoUrl);
    } catch (error) {
      console.error('Khong the xoa video bai hoc khi xoa khoa hoc:', error);
    }
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
      throw new ForbiddenException('B?n kh?ng c? quy?n s?a kh?a h?c n?y');
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
          'Khóa học chưa có video bài học. Vui lòng thêm ít nhất một bài học có video trước khi gửi duyệt.',
        );
      }

      const normalizeStatus = (value: string | null | undefined) =>
        String(value ?? '').trim().toUpperCase();

      const pendingLessons = lessons.filter((lesson) =>
        ['PENDING', 'PROCESSING'].includes(normalizeStatus(lesson.aiStatus)),
      );
      if (pendingLessons.length > 0) {
        const details = pendingLessons
          .map((lesson) => {
            const lessonTitle =
              lesson.tenBaiHoc?.trim() || `Bài ${lesson.maBH}`;
            const status = lesson.aiStatus || 'CHƯA KIỂM DUYỆT';
            const reason =
              lesson.aiRejectReason || 'Đang chờ AI xử lý hoặc cần xem xét lại';
            return `- ${lessonTitle}: ${status} - ${reason}`;
          })
          .join('\n');

        throw new BadRequestException(
          `Kh?a h?c c?n video ?ang ch? AI x? l?. Vui l?ng ??i ho?n t?t tr??c khi g?i duy?t.\n${details}`,
        );
      }

      const flaggedLessons = lessons.filter((lesson) => {
        const status = normalizeStatus(lesson.aiStatus);
        return status === 'NEEDS_REVIEW' || status === 'REJECTED';
      });
      const reviewRatio = flaggedLessons.length / lessons.length;

      // Sửa lỗi: Luôn đặt trạng thái là PENDING để Admin phê duyệt thủ công.
      // Không tự động PUBLISHED kể cả khi AI đánh giá tốt.
      const nextStatus = reviewRatio <= COURSE_AUTO_REJECT_THRESHOLD ? 'PENDING' : 'DRAFT';

      await this.khoaHocRepository.update(courseId, {
        trangThai: nextStatus,
        ngayCapNhat: new Date(),
      });

      if (nextStatus === 'DRAFT' && flaggedLessons.length > 0) {
        await this.sendAutoRejectNotification({
          courseId,
          instructorId,
          courseName: course.tenKhoaHoc,
          reviewRatio,
          flaggedLessons,
        });
      }

      return {
        id: courseId,
        trangThai: nextStatus,
        reviewRatio,
        reviewCount: flaggedLessons.length,
        totalVideoLessons: lessons.length,
      };
    }

    await this.khoaHocRepository.update(courseId, {
      trangThai,
      ngayCapNhat: new Date(),
    });
    return {
      id: courseId,
      trangThai,
      reviewRatio: null,
      reviewCount: 0,
      totalVideoLessons: 0,
    };
  }

  private async sendAutoRejectNotification(input: {
    courseId: number;
    instructorId: number;
    courseName?: string | null;
    reviewRatio: number;
    flaggedLessons: CourseLessonRow[];
  }) {
    const { instructorId, courseName, reviewRatio, flaggedLessons, courseId } = input;
    const safeCourseName = courseName?.trim() || `KhÃ³a há»c #${courseId}`;
    const lessonSummary = flaggedLessons
      .slice(0, 5)
      .map((lesson) => {
        const lessonTitle = lesson.tenBaiHoc?.trim() || `BÃ i ${lesson.maBH}`;
        const status = lesson.aiStatus || 'UNKNOWN';
        const reason = lesson.aiRejectReason?.trim();
        return `- ${lessonTitle} (${status})${reason ? `: ${reason}` : ''}`;
      })
      .join('\n');

    try {
      await this.notificationsService.createNotification({
        maND: instructorId,
        maNguoiGui: null,
        loaiThongBao: NotificationType.COURSE,
        tieuDe: 'KhÃ³a há»c bá» tá»« chá»i tá»± Äá»ng',
        noiDung: [
          `${safeCourseName} ÄÃ£ bá» tá»« chá»i tá»± Äá»ng vÃ¬ tá»· lá» ná»i dung cáº§n Äiá»u chá»nh lÃ  ${Math.round(
            reviewRatio * 100,
          )}% vÃ  vÆ°á»£t ngÆ°á»¡ng cho phÃ©p.`,
          'Vui lÃ²ng Äiá»u chá»nh láº¡i ná»i dung khÃ³a há»c cho phÃ¹ há»£p trÆ°á»c khi gá»­i duyá»t láº¡i.',
          lessonSummary ? `CÃ¡c bÃ i há»c cáº§n xem láº¡i:\n${lessonSummary}` : null,
        ]
          .filter(Boolean)
          .join('\n\n'),
        daDoc: false,
      });
    } catch (error) {
      console.error('KhÃ´ng thá» gá»­i thÃ´ng bÃ¡o tá»± Äá»ng tá»« chá»i khÃ³a há»c:', error);
    }
  }

  private async sendAutoApproveNotification(input: {
    instructorId: number;
    courseName?: string | null;
    reviewRatio: number;
    totalVideoLessons: number;
  }) {
    const { instructorId, courseName, reviewRatio, totalVideoLessons } = input;
    const safeCourseName = courseName?.trim() || 'Kh???a h???c c???a b???n';
    const percent = Math.round(reviewRatio * 100);

    try {
      await this.notificationsService.createNotification({
        maND: instructorId,
        maNguoiGui: null,
        loaiThongBao: NotificationType.COURSE,
        tieuDe: 'Kh???a h???c ???? ???????c t??? duy???t',
        noiDung: `${safeCourseName} ???? ???????c t??? duy???t v?? s???n s??ng public. T??? l??? n???i dung c???n ??i???u ch???nh l?? ${percent}% tr??n ${totalVideoLessons} b??i h???c c?? video.`,
        daDoc: false,
      });
    } catch (error) {
      console.error('Kh??ng th??? g???i th??ng b??o t??? duy???t kh??a h???c:', error);
    }
  }

  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Kh?ng t?m th?y kh?a h?c ho?c b?n kh?ng c? quy?n truy c?p',
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
      throw new ForbiddenException('B?n kh?ng c? quy?n s?a kh?a h?c n?y');
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
   * T?nh t?ng s? l??ng kh?a h?c v? t?ng s? h?c vi?n c?a m?t gi?ng vi?n
   * X? l? tr??ng h?p d? li?u r?ng v? ??m b?o t?nh th?ng nh?t c?a logic ??m.
   */
  async getInstructorStats(
    instructorId: number,
  ): Promise<{ totalCourses: number; totalStudents: number }> {
    // T?nh t?ng s? kh?a h?c (bao g?m c? ?ang ch? duy?t v? ?? duy?t)
    const totalCoursesResult = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM KhoaHoc WHERE MaND_GiangVien = ? AND TrangThai IN ('PUBLISHED', 'PENDING')`,
      [instructorId],
    );
    const totalCourses =
      totalCoursesResult.length > 0
        ? Number(totalCoursesResult[0].total || 0)
        : 0;

    // T?nh t?ng s? h?c vi?n (unique) ??ng k? t?t c? kh?a h?c c?a gi?ng vi?n
    // ??m b?o ch? ??m c?c giao d?ch ACTIVE
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
   * T?nh t?ng s? l??ng h?c vi?n ?? ??ng k? th?nh c?ng m?t kh?a h?c c? th?
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

