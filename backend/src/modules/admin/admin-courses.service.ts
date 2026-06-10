import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KhoaHoc } from '../courses/entities/course.entity';
import {
  CourseModerationAction,
  CourseModerationHistory,
} from './entities/course-moderation-history.entity';
import {
  NotificationType,
} from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';

type AdminCourseRow = {
  id?: string | number;
  tenKhoaHoc?: string;
  giaBan?: string | number;
  trangThai?: string;
  hinhThuNho?: string | null;
  moTa?: string | null;
  instructorId?: string | number;
  instructorName?: string;
  instructorEmail?: string;
  instructorAvatar?: string | null;
  categoryName?: string | null;
  lessonCount?: string | number;
  orderCount?: string | number;
};

type CourseGoalRow = { NoiDung?: string | null };
type CurriculumRow = {
  maChuong?: string | number;
  tenChuong?: string | null;
  thuTuChuong?: string | number;
  maBH?: string | number | null;
  tenBaiHoc?: string | null;
  thuTuBaiHoc?: string | number | null;
  noiDungBaiHoc?: string | null;
  videoURL?: string | null;
  trangThaiBaiHoc?: string | null;
};
type ModerationHistoryRow = {
  maLSKD?: string | number;
  hanhDong?: string;
  ghiChu?: string | null;
  thoiGian?: string | Date;
  adminId?: string | number;
  adminName?: string | null;
};

export interface AdminCourseFilters {
  search?: string;
  status?: string;
}

@Injectable()
export class AdminCoursesService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly courseRepository: Repository<KhoaHoc>,
    @InjectRepository(CourseModerationHistory)
    private readonly moderationHistoryRepository: Repository<CourseModerationHistory>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async getCourses(filters: AdminCourseFilters) {
    const { sql, params } = this.buildCourseListQuery(filters);
    const rows = (await this.dataSource.query(sql, params)) as AdminCourseRow[];

    return rows.map((row: AdminCourseRow) => ({
      id: Number(row.id ?? 0),
      tenKhoaHoc: row.tenKhoaHoc ?? '',
      giaBan: Number(row.giaBan ?? 0),
      trangThai: row.trangThai ?? 'DRAFT',
      hinhThuNho: row.hinhThuNho ?? null,
      moTa: row.moTa ?? '',
      instructorId: Number(row.instructorId ?? 0),
      instructorName: row.instructorName ?? '',
      instructorEmail: row.instructorEmail ?? '',
      instructorAvatar: row.instructorAvatar ?? null,
      categoryName: row.categoryName ?? 'Chua phan loai',
      lessonCount: Number(row.lessonCount ?? 0),
      orderCount: Number(row.orderCount ?? 0),
    }));
  }

  async getCourseDetail(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { maKH: courseId },
    });
    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc.');
    }

    const mucTieuRows = (await this.dataSource.query(
      `SELECT NoiDung FROM MucTieuKhoaHoc WHERE MaKH = ? ORDER BY MaMT ASC`,
      [courseId],
    )) as CourseGoalRow[];
    const yeuCauRows = (await this.dataSource.query(
      `SELECT NoiDung FROM YeuCauKhoaHoc WHERE MaKH = ? ORDER BY MaYC ASC`,
      [courseId],
    )) as CourseGoalRow[];
    const curriculumRows = (await this.dataSource.query(
      `
        SELECT
          ch.MaChuong as maChuong,
          ch.TenChuong as tenChuong,
          ch.ThuTu as thuTuChuong,
          bh.MaBH as maBH,
          bh.TenBaiHoc as tenBaiHoc,
          bh.ThuTu as thuTuBaiHoc,
          bh.NoiDung as noiDungBaiHoc,
          bh.VideoURL as videoURL,
          bh.TrangThai as trangThaiBaiHoc
        FROM ChuongHoc ch
        LEFT JOIN BaiHoc bh ON bh.MaChuong = ch.MaChuong
        WHERE ch.MaKH = ?
        ORDER BY ch.ThuTu ASC, bh.ThuTu ASC, bh.MaBH ASC
      `,
      [courseId],
    )) as CurriculumRow[];
    const moderationRows = (await this.dataSource.query(
      `
        SELECT
          ls.MaLSKD as maLSKD,
          ls.HanhDong as hanhDong,
          ls.GhiChu as ghiChu,
          ls.ThoiGian as thoiGian,
          admin.MaND as adminId,
          admin.HoTen as adminName
        FROM LichSuKiemDuyetKhoaHoc ls
        JOIN NguoiDung admin ON admin.MaND = ls.MaND_Admin
        WHERE ls.MaKH = ?
        ORDER BY ls.ThoiGian DESC, ls.MaLSKD DESC
      `,
      [courseId],
    )) as ModerationHistoryRow[];

    return {
      id: course.maKH,
      tenKhoaHoc: course.tenKhoaHoc,
      moTa: course.moTa ?? '',
      giaBan: Number(course.giaBan ?? 0),
      trangThai: course.trangThai,
      hinhThuNho: course.hinhThuNho ?? null,
      maDM: course.maDM,
      instructorId: course.maND_GiangVien,
      mucTieu: mucTieuRows
        .map((item) => item.NoiDung?.trim() ?? '')
        .filter(Boolean),
      yeuCau: yeuCauRows
        .map((item) => item.NoiDung?.trim() ?? '')
        .filter(Boolean),
      curriculum: this.mapCurriculum(curriculumRows),
      moderationHistory: moderationRows.map((row) => ({
        maLSKD: Number(row.maLSKD ?? 0),
        hanhDong: row.hanhDong ?? 'REJECT',
        ghiChu: row.ghiChu ?? null,
        thoiGian:
          row.thoiGian instanceof Date
            ? row.thoiGian.toISOString()
            : String(row.thoiGian ?? ''),
        adminId: Number(row.adminId ?? 0),
        adminName: row.adminName ?? 'Admin',
      })),
    };
  }

  async approveCourse(courseId: number, adminId: number) {
    const course = await this.courseRepository.findOne({
      where: { maKH: courseId },
    });
    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc.');
    }
    if (course.trangThai !== 'PENDING') {
      throw new BadRequestException(
        'Chi khoa hoc dang cho duyet moi co the phe duyet.',
      );
    }

    course.trangThai = 'PUBLISHED';
    await this.courseRepository.save(course);
    await this.notificationsService.createNotification({
        maND: course.maND_GiangVien,
        maNguoiGui: adminId,
        loaiThongBao: NotificationType.COURSE,
        tieuDe: 'Khoa hoc da duoc phe duyet',
        noiDung: this.buildApprovalNotification(course.tenKhoaHoc),
        daDoc: false,
    });
    await this.moderationHistoryRepository.save(
      this.moderationHistoryRepository.create({
        maKH: course.maKH,
        maND_Admin: adminId,
        hanhDong: CourseModerationAction.APPROVE,
        ghiChu: null,
      }),
    );

    return {
      message: 'Da phe duyet khoa hoc thanh cong.',
      data: { id: course.maKH, trangThai: course.trangThai },
    };
  }

  async rejectCourse(courseId: number, adminId: number, reason?: string) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Ly do tu choi khong duoc de trong.');
    }

    const course = await this.courseRepository.findOne({
      where: { maKH: courseId },
    });
    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc.');
    }
    if (course.trangThai !== 'PENDING') {
      throw new BadRequestException(
        'Chi khoa hoc dang cho duyet moi co the tu choi.',
      );
    }

    course.trangThai = 'DRAFT';
    await this.courseRepository.save(course);
    await this.notificationsService.createNotification({
        maND: course.maND_GiangVien,
        maNguoiGui: adminId,
        loaiThongBao: NotificationType.COURSE,
        tieuDe: 'Khoa hoc bi tu choi xuat ban',
        noiDung: this.buildRejectionNotification(
          course.tenKhoaHoc,
          trimmedReason,
        ),
        daDoc: false,
    });
    await this.moderationHistoryRepository.save(
      this.moderationHistoryRepository.create({
        maKH: course.maKH,
        maND_Admin: adminId,
        hanhDong: CourseModerationAction.REJECT,
        ghiChu: trimmedReason,
      }),
    );

    return {
      message: 'Da tu choi khoa hoc va chuyen ve ban nhap.',
      data: {
        id: course.maKH,
        trangThai: course.trangThai,
        lyDo: trimmedReason,
      },
    };
  }

  private buildCourseListQuery(filters: AdminCourseFilters) {
    let sql = `
      SELECT
        kh.MaKH as id,
        kh.TenKhoaHoc as tenKhoaHoc,
        kh.GiaBan as giaBan,
        kh.TrangThai as trangThai,
        kh.HinhThuNho as hinhThuNho,
        kh.MoTa as moTa,
        nd.MaND as instructorId,
        nd.HoTen as instructorName,
        nd.Email as instructorEmail,
        nd.AnhDaiDien as instructorAvatar,
        dm.TenDM as categoryName,
        COUNT(DISTINCT bh.MaBH) as lessonCount,
        COUNT(DISTINCT cthd.MaHD) as orderCount
      FROM KhoaHoc kh
      JOIN NguoiDung nd ON kh.MaND_GiangVien = nd.MaND
      LEFT JOIN DanhMuc dm ON kh.MaDM = dm.MaDM
      LEFT JOIN BaiHoc bh ON bh.MaKH = kh.MaKH
      LEFT JOIN ChiTietHoaDon cthd ON cthd.MaKH = kh.MaKH
      WHERE 1 = 1
    `;
    const params: any[] = [];

    if (filters.status && filters.status !== 'ALL') {
      sql += ` AND kh.TrangThai = ?`;
      params.push(filters.status);
    }

    if (filters.search?.trim()) {
      sql += ` AND (kh.TenKhoaHoc LIKE ? OR nd.HoTen LIKE ? OR nd.Email LIKE ?)`;
      const searchTerm = `%${filters.search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += `
      GROUP BY
        kh.MaKH,
        kh.TenKhoaHoc,
        kh.GiaBan,
        kh.TrangThai,
        kh.HinhThuNho,
        kh.MoTa,
        nd.MaND,
        nd.HoTen,
        nd.Email,
        nd.AnhDaiDien,
        dm.TenDM
      ORDER BY
        CASE WHEN kh.TrangThai = 'PENDING' THEN 0 ELSE 1 END,
        kh.MaKH DESC
    `;

    return { sql, params };
  }

  private mapCurriculum(rows: CurriculumRow[]) {
    const chapters = new Map<
      number,
      {
        maChuong: number;
        tenChuong: string;
        thuTu: number;
        baiHocs: Array<{
          maBH: number;
          tenBaiHoc: string;
          thuTu: number;
          noiDung: string;
          videoURL: string | null;
          trangThai: string;
        }>;
      }
    >();

    for (const row of rows) {
      const maChuong = Number(row.maChuong ?? 0);
      if (!chapters.has(maChuong)) {
        chapters.set(maChuong, {
          maChuong,
          tenChuong: row.tenChuong ?? '',
          thuTu: Number(row.thuTuChuong ?? 0),
          baiHocs: [],
        });
      }

      if (row.maBH == null) {
        continue;
      }

      chapters.get(maChuong)?.baiHocs.push({
        maBH: Number(row.maBH),
        tenBaiHoc: row.tenBaiHoc ?? '',
        thuTu: Number(row.thuTuBaiHoc ?? 0),
        noiDung: row.noiDungBaiHoc ?? '',
        videoURL: row.videoURL ?? null,
        trangThai: row.trangThaiBaiHoc ?? 'ACTIVE',
      });
    }

    return [...chapters.values()];
  }

  private buildApprovalNotification(courseName: string | undefined) {
    const safeCourseName = courseName?.trim() || 'Khoa hoc cua ban';
    return `${safeCourseName} da duoc phe duyet va san sang xuat ban tren he thong.`;
  }

  private buildRejectionNotification(
    courseName: string | undefined,
    reason: string,
  ) {
    const safeCourseName = courseName?.trim() || 'Khoa hoc cua ban';
    return `${safeCourseName} da bi tu choi xuat ban. Noi dung can chinh sua: ${reason}`;
  }
}
