import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  ADMIN_REVENUE_SHARE,
  INSTRUCTOR_REVENUE_SHARE,
} from '../../../common/constants/revenue-share';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { User, UserRole } from '../../users/entities/user.entity';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';
import { HoSoGiangVien } from '../entities/ho-so-giang-vien.entity';

export interface InstructorPrincipal {
  maND?: number;
  S;
  sub?: number;
  vaiTro?: UserRole;
}

export interface InstructorStudentFilters {
  courseId?: number;
  search?: string;
}

export interface InstructorCourseOption {
  courseId: number;
  courseName: string;
  coursePrice: number;
  status: string;
  createdAt: string;
}

export interface InstructorStudentCourse {
  courseId: number;
  courseName: string;
  coursePrice: number;
  purchasedAt: string;
}

export interface InstructorStudentSummary {
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  totalSpent: number;
  purchasedAt: string;
}

export interface InstructorStudentBoard {
  totalStudents: number;
  totalPurchases: number;
  totalRevenue: number;
  students: InstructorStudentSummary[];
}

export type InstructorReportRange =
  | '30days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all_time';

export interface InstructorReportFilters {
  courseId?: number;
  range?: InstructorReportRange;
}

export interface InstructorRevenuePoint {
  label: string;
  revenue: number;
  grossRevenue: number;
  adminRevenue: number;
  instructorRevenue: number;
  enrollments: number;
}

export interface InstructorTopCourseReport {
  courseId: number;
  courseName: string;
  revenue: number;
  grossRevenue: number;
  adminRevenue: number;
  instructorRevenue: number;
  enrollments: number;
  averageRating: number | null;
  reviewCount: number;
  ratingLabel: string;
  imageUrl: string | null;
}

export interface InstructorRecentEnrollment {
  enrollmentCode: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  courseId: number;
  courseName: string;
  amount: number;
  grossAmount: number;
  adminAmount: number;
  instructorAmount: number;
  couponCode: string | null;
  status: string;
  purchasedAt: string;
}

export interface InstructorReportsBoard {
  filters: {
    courseId: number | null;
    range: InstructorReportRange;
  };
  overview: {
    totalRevenue: number;
    grossRevenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    revenueGrowth: number;
    newEnrollments: number;
    enrollmentGrowth: number;
    totalStudents: number;
    totalStudentsGrowth: number;
    activeCourses: number;
    pendingCourses: number;
    averageRating: number | null;
    averageRatingLabel: string;
    averageRatingSource: 'mockdata' | 'database';
  };
  learning: {
    totalStudents: number;
    repeatStudents: number;
    completionRate: number | null;
    completionRateLabel: string;
    completionRateSource: 'mockdata' | 'database';
  };
  quality: {
    averageRating: number | null;
    averageRatingLabel: string;
    averageRatingSource: 'mockdata' | 'database';
    reviewCount: number;
    fiveStarReviews: number;
    lowStarReviews: number;
    unrespondedReviews: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
    topRatedCourses: Array<{
      courseId: number;
      courseName: string;
      averageRating: number;
      reviewCount: number;
      imageUrl: string | null;
    }>;
  };
  operations: {
    activeCourses: number;
    pendingCourses: number;
    unansweredQuestions: number;
    unrespondedReviews: number;
    expiringCoupons: number;
    latestRejectedCourse: {
      courseId: number;
      courseName: string;
      reason: string | null;
      createdAt: string | null;
    } | null;
  };
  revenueSeries: InstructorRevenuePoint[];
  revenueSeriesSource: 'database';
  topCourses: InstructorTopCourseReport[];
  topCoursesSource: 'database';
  recentEnrollments: InstructorRecentEnrollment[];
  recentEnrollmentsSource: 'database';
  traffic: {
    revenueBySource: Array<{
      label: string;
      percentage: number;
      color: string;
      orderCount: number;
      grossRevenue: number;
    }>;
    revenueBySourceLabel: string;
    revenueBySourceSource: 'database' | 'mockdata';
  };
}

type RawLearningStatsRow = {
  totalStudents: number | string | null;
  repeatStudents: number | string | null;
  totalLessonSlots: number | string | null;
  completedLessonSlots: number | string | null;
};

type RawCourseStatusRow = {
  activeCourses: number | string | null;
  pendingCourses: number | string | null;
};

type RawReviewSummaryRow = {
  averageRating: number | string | null;
  reviewCount: number | string | null;
  fiveStarReviews: number | string | null;
  lowStarReviews: number | string | null;
};

type RawUnrespondedReviewRow = {
  unrespondedReviews: number | string | null;
};

type RawDiscussionSummaryRow = {
  unansweredQuestions: number | string | null;
};

type RawTrafficSourceRow = {
  trafficSource: string | null;
  orderCount: number | string | null;
  grossRevenue: number | string | null;
};

type RawRatingDistributionRow = {
  rating: number | string | null;
  count: number | string | null;
};

type RawLatestRejectedCourseRow = {
  courseId: number | string | null;
  courseName: string | null;
  reason: string | null;
  createdAt: string | Date | null;
};

type RawTopCourseRatingRow = {
  courseId: number | string;
  averageRating: number | string | null;
  reviewCount: number | string | null;
};

type RawTopRatedCourseRow = {
  courseId: number | string;
  courseName: string;
  averageRating: number | string | null;
  reviewCount: number | string | null;
  imageUrl: string | null;
};

type RawStudentRow = {
  studentId: number | string;
  studentName: string;
  studentEmail: string;
  courseId: number | string;
  courseName: string;
  coursePrice: number | string | null;
  purchasedAt: string;
};

type RawRevenueSeriesRow = {
  periodLabel: string;
  revenue: number | string | null;
  grossRevenue?: number | string | null;
  adminRevenue?: number | string | null;
  instructorRevenue?: number | string | null;
  enrollments: number | string | null;
};

type RawTopCourseRow = {
  courseId: number | string;
  courseName: string;
  revenue: number | string | null;
  grossRevenue?: number | string | null;
  adminRevenue?: number | string | null;
  instructorRevenue?: number | string | null;
  enrollments: number | string | null;
  averageRating?: number | string | null;
  reviewCount?: number | string | null;
  imageUrl: string | null;
};

type RawRecentEnrollmentRow = {
  enrollmentCode: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  courseId: number | string;
  courseName: string;
  amount: number | string | null;
  grossAmount?: number | string | null;
  adminAmount?: number | string | null;
  instructorAmount?: number | string | null;
  couponCode: string | null;
  status: string;
  purchasedAt: string;
};

@Injectable()
export class InstructorsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(HoSoGiangVien)
    private readonly hoSoRepo: Repository<HoSoGiangVien>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateProfile(
    principal: InstructorPrincipal,
    dto: UpdateInstructorProfileDto,
    file?: Express.Multer.File,
  ) {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    const user = await this.userRepo.findOne({ where: { maND: instructorId } });
    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan nguoi dung.');
    }

    let isUserUpdated = false;
    if (dto.HoTen !== undefined) {
      user.hoTen = dto.HoTen;
      isUserUpdated = true;
    }

    if (file) {
      if (user.anhDaiDien) {
        const oldPublicId = this.cloudinaryService.extractPublicId(
          user.anhDaiDien,
        );
        if (oldPublicId) {
          try {
            await this.cloudinaryService.deleteFile(oldPublicId, 'image');
          } catch (deleteError) {
            console.error(
              'Loi khi xoa anh dai dien cu tren Cloudinary:',
              deleteError,
            );
          }
        }
      }

      const uploadResult = await this.cloudinaryService.uploadFile(file);
      user.anhDaiDien = uploadResult.secure_url || uploadResult.url;
      isUserUpdated = true;
    }

    if (isUserUpdated) {
      await this.userRepo.save(user);
    }

    let profile = await this.hoSoRepo.findOne({
      where: { MaND: instructorId },
    });
    if (!profile) {
      profile = this.hoSoRepo.create({ MaND: instructorId });
    }

    if (dto.TieuSu !== undefined) profile.TieuSu = dto.TieuSu;
    if (dto.ChuyenMon !== undefined) profile.ChuyenMon = dto.ChuyenMon;
    if (dto.SoTaiKhoan !== undefined) profile.SoTaiKhoan = dto.SoTaiKhoan;
    if (dto.FacebookURL !== undefined) profile.FacebookURL = dto.FacebookURL;
    if (dto.InstagramURL !== undefined) profile.InstagramURL = dto.InstagramURL;
    if (dto.GitHubURL !== undefined) profile.GitHubURL = dto.GitHubURL;
    if (dto.WebsiteURL !== undefined) profile.WebsiteURL = dto.WebsiteURL;

    await this.hoSoRepo.save(profile);

    return {
      message: 'Cap nhat tron bo ho so thanh cong',
      user: {
        HoTen: user.hoTen,
        AnhDaiDien: user.anhDaiDien,
      },
      profile,
    };
  }

  async getMyCourses(
    principal: InstructorPrincipal,
  ): Promise<InstructorCourseOption[]> {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    try {
      const rows = await this.dataSource.query(
        `
          SELECT
            MaKH AS courseId,
            TenKhoaHoc AS courseName,
            GiaBan AS coursePrice,
            TrangThai AS status,
            MaKH AS createdAt
          FROM KhoaHoc
          WHERE MaND_GiangVien = ?
          ORDER BY MaKH DESC
        `,
        [instructorId],
      );

      return rows.map((row: InstructorCourseOption) => ({
        courseId: Number(row.courseId),
        courseName: row.courseName,
        coursePrice: this.toNumber(row.coursePrice),
        status: row.status,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Failed to load instructor courses', error);
      return [];
    }
  }

  async getMyStudents(
    principal: InstructorPrincipal,
    filters: InstructorStudentFilters,
  ): Promise<InstructorStudentBoard> {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    let rows: RawStudentRow[] = [];

    try {
      const { sql, params } = this.buildStudentQuery(instructorId, filters);
      rows = await this.dataSource.query(sql, params);
    } catch (error) {
      console.error('Loi khi tai danh sach hoc vien:', error);
      return {
        totalStudents: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        students: [],
      };
    }

    const flatStudentsList = rows.map((row) => ({
      studentId: Number(row.studentId),
      studentName: row.studentName,
      studentEmail: row.studentEmail,
      courseId: Number(row.courseId),
      courseName: row.courseName,
      totalSpent: this.toNumber(row.coursePrice),
      purchasedAt: row.purchasedAt,
    }));

    const uniqueStudentIds = new Set(flatStudentsList.map((s) => s.studentId));
    const totalRevenue = flatStudentsList.reduce(
      (sum, current) => sum + current.totalSpent,
      0,
    );

    return {
      totalStudents: uniqueStudentIds.size,
      totalPurchases: flatStudentsList.length,
      totalRevenue,
      students: flatStudentsList,
    };
  }

  async getMyReports(
    principal: InstructorPrincipal,
    filters: InstructorReportFilters,
  ): Promise<InstructorReportsBoard> {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);
    const range = filters.range ?? '30days';
    const courseId = filters.courseId;

    const whereClause = this.buildReportWhereClause(
      instructorId,
      courseId,
      range,
    );
    const previousWhereClause = this.buildPreviousReportWhereClause(
      instructorId,
      courseId,
      range,
    );
    const paidRevenueJoins = this.buildPaidRevenueJoins();
    const grossRevenueSql = this.buildLineNetRevenueSql();
    const instructorRevenueSql = `(${grossRevenueSql}) * ${INSTRUCTOR_REVENUE_SHARE}`;
    const adminRevenueSql = `(${grossRevenueSql}) * ${ADMIN_REVENUE_SHARE}`;

    const reviewWhereClause = this.buildReviewReportWhereClause(
      instructorId,
      courseId,
      range,
    );
    const courseOwnershipClause = this.buildCourseOwnershipClause(
      instructorId,
      courseId,
    );
    const rejectedCourseClause = this.buildRejectedCourseClause(
      instructorId,
      courseId,
    );
    const currentStudentMetricSql = `COUNT(DISTINCT dk.MaND)`;
    const previousStudentMetricSql = `COUNT(DISTINCT dk.MaND)`;

    const [
      overviewRows,
      previousRows,
      courseStatusRows,
      learningRows,
      revenueSeriesRows,
      topCourseRows,
      topRatedCourseRows,
      recentRows,
      trafficRows,
      reviewSummaryRows,
      unrespondedReviewRows,
      ratingDistributionRows,
      discussionRows,
      latestRejectedCourseRows,
      expiringCouponRows,
    ] = await Promise.all([
      this.dataSource.query(
        `
            SELECT
              COUNT(*) AS enrollments,
              ${currentStudentMetricSql} AS totalStudents,
              COALESCE(SUM(${grossRevenueSql}), 0) AS grossRevenue,
              COALESCE(SUM(${adminRevenueSql}), 0) AS adminRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS instructorRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS revenue
            FROM DangKyKhoaHoc dk
            ${paidRevenueJoins}
            WHERE ${whereClause}
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              COUNT(*) AS enrollments,
              ${previousStudentMetricSql} AS totalStudents,
              COALESCE(SUM(${grossRevenueSql}), 0) AS grossRevenue,
              COALESCE(SUM(${adminRevenueSql}), 0) AS adminRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS instructorRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS revenue
            FROM DangKyKhoaHoc dk
            ${paidRevenueJoins}
            WHERE ${previousWhereClause}
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              SUM(CASE WHEN kh.TrangThai = 'PUBLISHED' THEN 1 ELSE 0 END) AS activeCourses,
              SUM(CASE WHEN kh.TrangThai = 'PENDING' THEN 1 ELSE 0 END) AS pendingCourses
            FROM KhoaHoc kh
            WHERE ${courseOwnershipClause}
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              COUNT(DISTINCT dk.MaND) AS totalStudents,
              COUNT(
                DISTINCT CASE
                  WHEN (
                    SELECT COUNT(*)
                    FROM DangKyKhoaHoc dk2
                    INNER JOIN KhoaHoc kh2 ON dk2.MaKH = kh2.MaKH
                    WHERE kh2.MaND_GiangVien = ${instructorId}
                      AND dk2.TrangThai = 'ACTIVE'
                      AND dk2.MaND = dk.MaND
                  ) > 1 THEN dk.MaND
                  ELSE NULL
                END
              ) AS repeatStudents,
              COUNT(DISTINCT CONCAT(dk.MaDangKy, '-', bh.MaBH)) AS totalLessonSlots,
              COUNT(
                DISTINCT CASE
                  WHEN td.DaHoanThanh = 1 THEN CONCAT(dk.MaDangKy, '-', bh.MaBH)
                  ELSE NULL
                END
              ) AS completedLessonSlots
            FROM DangKyKhoaHoc dk
            INNER JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
            LEFT JOIN BaiHoc bh ON bh.MaKH = kh.MaKH
            LEFT JOIN TienDoHocTap td ON td.MaND = dk.MaND AND td.MaBH = bh.MaBH
            WHERE ${whereClause}
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              ${this.buildPeriodSelect(range)} AS periodLabel,
              COALESCE(SUM(${grossRevenueSql}), 0) AS grossRevenue,
              COALESCE(SUM(${adminRevenueSql}), 0) AS adminRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS instructorRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS revenue,
              COUNT(*) AS enrollments
            FROM DangKyKhoaHoc dk
            ${paidRevenueJoins}
            WHERE ${whereClause}
            GROUP BY periodLabel
            ORDER BY MIN(dk.NgayDangKy) ASC
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              kh.MaKH AS courseId,
              kh.TenKhoaHoc AS courseName,
              COALESCE(SUM(${grossRevenueSql}), 0) AS grossRevenue,
              COALESCE(SUM(${adminRevenueSql}), 0) AS adminRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS instructorRevenue,
              COALESCE(SUM(${instructorRevenueSql}), 0) AS revenue,
              COUNT(*) AS enrollments,
              COALESCE(AVG(CASE WHEN dg.SoSao > 0 AND dg.MaDanhGiaCha IS NULL THEN dg.SoSao END), 0) AS averageRating,
              COUNT(DISTINCT CASE WHEN dg.SoSao > 0 AND dg.MaDanhGiaCha IS NULL THEN dg.MaDanhGia END) AS reviewCount,
              kh.HinhThuNho AS imageUrl
            FROM DangKyKhoaHoc dk
            ${paidRevenueJoins}
            LEFT JOIN DanhGiaKhoaHoc dg ON dg.MaKH = kh.MaKH
            WHERE ${whereClause}
            GROUP BY kh.MaKH, kh.TenKhoaHoc, kh.HinhThuNho
            ORDER BY revenue DESC, enrollments DESC, kh.MaKH DESC
            LIMIT 5
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              kh.MaKH AS courseId,
              kh.TenKhoaHoc AS courseName,
              ROUND(AVG(dg.SoSao), 1) AS averageRating,
              COUNT(*) AS reviewCount,
              kh.HinhThuNho AS imageUrl
            FROM DanhGiaKhoaHoc dg
            INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
            WHERE ${reviewWhereClause}
              AND dg.MaDanhGiaCha IS NULL
            GROUP BY kh.MaKH, kh.TenKhoaHoc, kh.HinhThuNho
            HAVING reviewCount > 0
            ORDER BY averageRating DESC, reviewCount DESC, kh.MaKH DESC
            LIMIT 3
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              CONCAT('#DK', dk.MaDangKy) AS enrollmentCode,
              nd.HoTen AS studentName,
              nd.Email AS studentEmail,
              nd.AnhDaiDien AS studentAvatar,
              kh.MaKH AS courseId,
              kh.TenKhoaHoc AS courseName,
              ${grossRevenueSql} AS grossAmount,
              ${adminRevenueSql} AS adminAmount,
              ${instructorRevenueSql} AS instructorAmount,
              ${instructorRevenueSql} AS amount,
              mg.MaCode AS couponCode,
              dk.TrangThai AS status,
              dk.NgayDangKy AS purchasedAt
            FROM DangKyKhoaHoc dk
            JOIN NguoiDung nd ON dk.MaND = nd.MaND
            ${paidRevenueJoins}
            WHERE ${whereClause}
            ORDER BY dk.NgayDangKy DESC
            LIMIT 8
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              CASE
                WHEN mg.MaCoupon IS NULL THEN 'Organic'
                ELSE 'Coupon / Promo'
              END AS trafficSource,
              COUNT(*) AS orderCount,
              COALESCE(SUM(${grossRevenueSql}), 0) AS grossRevenue
            FROM DangKyKhoaHoc dk
            ${paidRevenueJoins}
            WHERE ${whereClause}
            GROUP BY trafficSource
            ORDER BY orderCount DESC, grossRevenue DESC
            LIMIT 4
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              COALESCE(AVG(dg.SoSao), 0) AS averageRating,
              COUNT(*) AS reviewCount,
              SUM(CASE WHEN dg.SoSao = 5 THEN 1 ELSE 0 END) AS fiveStarReviews,
              SUM(CASE WHEN dg.SoSao IN (1, 2) THEN 1 ELSE 0 END) AS lowStarReviews
            FROM DanhGiaKhoaHoc dg
            INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
            WHERE ${reviewWhereClause}
              AND dg.MaDanhGiaCha IS NULL
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              COUNT(*) AS unrespondedReviews
            FROM DanhGiaKhoaHoc dg
            INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
            WHERE ${reviewWhereClause}
              AND dg.MaDanhGiaCha IS NULL
              AND NOT EXISTS (
                SELECT 1
                FROM DanhGiaKhoaHoc reply
                WHERE reply.MaDanhGiaCha = dg.MaDanhGia
              )
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              dg.SoSao AS rating,
              COUNT(*) AS count
            FROM DanhGiaKhoaHoc dg
            INNER JOIN KhoaHoc kh ON dg.MaKH = kh.MaKH
            WHERE ${reviewWhereClause}
              AND dg.MaDanhGiaCha IS NULL
            GROUP BY dg.SoSao
            ORDER BY dg.SoSao DESC
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              COUNT(*) AS unansweredQuestions
            FROM ThaoLuanKhoaHoc tl
            INNER JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
            WHERE ${courseOwnershipClause}
              AND tl.MaThaoLuanCha IS NULL
              AND NOT EXISTS (
                SELECT 1
                FROM ThaoLuanKhoaHoc reply
                WHERE reply.MaThaoLuanCha = tl.MaThaoLuan
              )
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              kh.MaKH AS courseId,
              kh.TenKhoaHoc AS courseName,
              ls.GhiChu AS reason,
              ls.ThoiGian AS createdAt
            FROM LichSuKiemDuyetKhoaHoc ls
            INNER JOIN KhoaHoc kh ON ls.MaKH = kh.MaKH
            WHERE ${rejectedCourseClause}
              AND ls.HanhDong = 'REJECT'
            ORDER BY ls.ThoiGian DESC, ls.MaLSKD DESC
            LIMIT 1
          `,
      ),
      this.dataSource.query(
        `
            SELECT
              COUNT(*) AS expiringCoupons
            FROM MaGiamGia mg
            INNER JOIN KhoaHoc kh ON mg.MaKH = kh.MaKH
            WHERE ${courseOwnershipClause}
              AND mg.TrangThai = 'ACTIVE'
              AND mg.NgayKetThuc IS NOT NULL
              AND mg.NgayKetThuc >= CURRENT_DATE()
              AND mg.NgayKetThuc < DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
          `,
      ),
    ]);

    const overviewRow = (
      overviewRows as Array<{
        enrollments?: number | string;
        totalStudents?: number | string;
        revenue?: number | string;
        grossRevenue?: number | string;
        adminRevenue?: number | string;
        instructorRevenue?: number | string;
      }>
    )[0] ?? {
      enrollments: 0,
      revenue: 0,
      grossRevenue: 0,
      adminRevenue: 0,
      instructorRevenue: 0,
    };
    const previousRow = (
      previousRows as Array<{
        enrollments?: number | string;
        totalStudents?: number | string;
        revenue?: number | string;
      }>
    )[0] ?? {
      enrollments: 0,
      totalStudents: 0,
      revenue: 0,
    };
    const courseStatusRow = (courseStatusRows as RawCourseStatusRow[])[0] ?? {
      activeCourses: 0,
      pendingCourses: 0,
    };
    const learningRow = (learningRows as RawLearningStatsRow[])[0] ?? {
      totalStudents: 0,
      repeatStudents: 0,
      totalLessonSlots: 0,
      completedLessonSlots: 0,
    };
    const reviewSummaryRow = (
      reviewSummaryRows as RawReviewSummaryRow[]
    )[0] ?? {
      averageRating: 0,
      reviewCount: 0,
      fiveStarReviews: 0,
      lowStarReviews: 0,
    };
    const unrespondedReviewRow = (
      unrespondedReviewRows as RawUnrespondedReviewRow[]
    )[0] ?? {
      unrespondedReviews: 0,
    };
    const discussionRow = (discussionRows as RawDiscussionSummaryRow[])[0] ?? {
      unansweredQuestions: 0,
    };
    const latestRejectedCourseRow = (
      latestRejectedCourseRows as RawLatestRejectedCourseRow[]
    )[0];
    const expiringCouponRow = (
      expiringCouponRows as Array<{ expiringCoupons?: number | string }>
    )[0] ?? {
      expiringCoupons: 0,
    };
    const ratingValue = this.toNumber(reviewSummaryRow.averageRating);
    const reviewCount = this.toNumber(reviewSummaryRow.reviewCount);
    const fiveStarReviews = this.toNumber(reviewSummaryRow.fiveStarReviews);
    const lowStarReviews = this.toNumber(reviewSummaryRow.lowStarReviews);
    const totalLessonSlots = this.toNumber(learningRow.totalLessonSlots);
    const completedLessonSlots = this.toNumber(learningRow.completedLessonSlots);
    const completionRate =
      totalLessonSlots > 0
        ? Number(((completedLessonSlots * 100) / totalLessonSlots).toFixed(1))
        : null;
    const trafficItems = this.buildTrafficItems(
      trafficRows as RawTrafficSourceRow[],
      this.toNumber(overviewRow.enrollments),
    );
    const ratingDistribution = this.buildRatingDistribution(
      ratingDistributionRows as RawRatingDistributionRow[],
      reviewCount,
    );

    return {
      filters: {
        courseId: courseId ?? null,
        range,
      },
      overview: {
        totalRevenue: this.toNumber(overviewRow.revenue),
        grossRevenue: this.toNumber(overviewRow.grossRevenue),
        adminRevenue: this.toNumber(overviewRow.adminRevenue),
        instructorRevenue: this.toNumber(overviewRow.instructorRevenue),
        revenueGrowth: this.calculateGrowth(
          this.toNumber(overviewRow.revenue),
          this.toNumber(previousRow.revenue),
        ),
        newEnrollments: this.toNumber(overviewRow.enrollments),
        enrollmentGrowth: this.calculateGrowth(
          this.toNumber(overviewRow.enrollments),
          this.toNumber(previousRow.enrollments),
        ),
        totalStudents: this.toNumber(overviewRow.totalStudents),
        totalStudentsGrowth: this.calculateGrowth(
          this.toNumber(overviewRow.totalStudents),
          this.toNumber(previousRow.totalStudents),
        ),
        activeCourses: this.toNumber(courseStatusRow.activeCourses),
        pendingCourses: this.toNumber(courseStatusRow.pendingCourses),
        averageRating: reviewCount > 0 ? Number(ratingValue.toFixed(1)) : null,
        averageRatingLabel:
          reviewCount > 0
            ? `Tu ${reviewCount} luot danh gia that`
            : 'Chua co du lieu danh gia that',
        averageRatingSource: reviewCount > 0 ? 'database' : 'mockdata',
      },
      learning: {
        totalStudents: this.toNumber(learningRow.totalStudents),
        repeatStudents: this.toNumber(learningRow.repeatStudents),
        completionRate,
        completionRateLabel:
          completionRate !== null
            ? `${completedLessonSlots}/${totalLessonSlots} dau muc bai hoc da hoan thanh`
            : 'Chua co du lieu tien do hoc tap',
        completionRateSource:
          completionRate !== null ? 'database' : 'mockdata',
      },
      quality: {
        averageRating: reviewCount > 0 ? Number(ratingValue.toFixed(1)) : null,
        averageRatingLabel:
          reviewCount > 0
            ? `Tu ${reviewCount} luot danh gia that`
            : 'Chua co du lieu danh gia that',
        averageRatingSource: reviewCount > 0 ? 'database' : 'mockdata',
        reviewCount,
        fiveStarReviews,
        lowStarReviews,
        unrespondedReviews: this.toNumber(
          unrespondedReviewRow.unrespondedReviews,
        ),
        ratingDistribution,
        topRatedCourses: (topRatedCourseRows as RawTopRatedCourseRow[]).map(
          (row) => ({
            courseId: Number(row.courseId ?? 0),
            courseName: row.courseName,
            averageRating: Number(this.toNumber(row.averageRating).toFixed(1)),
            reviewCount: this.toNumber(row.reviewCount),
            imageUrl: row.imageUrl ?? null,
          }),
        ),
      },
      operations: {
        activeCourses: this.toNumber(courseStatusRow.activeCourses),
        pendingCourses: this.toNumber(courseStatusRow.pendingCourses),
        unansweredQuestions: this.toNumber(discussionRow.unansweredQuestions),
        unrespondedReviews: this.toNumber(
          unrespondedReviewRow.unrespondedReviews,
        ),
        expiringCoupons: this.toNumber(expiringCouponRow.expiringCoupons),
        latestRejectedCourse: latestRejectedCourseRow
          ? {
              courseId: Number(latestRejectedCourseRow.courseId ?? 0),
              courseName: latestRejectedCourseRow.courseName ?? '',
              reason: latestRejectedCourseRow.reason ?? null,
              createdAt: this.toIsoStringOrNull(latestRejectedCourseRow.createdAt),
            }
          : null,
      },
      revenueSeries: (revenueSeriesRows as RawRevenueSeriesRow[]).map(
        (row) => ({
          label: row.periodLabel,
          revenue: this.toNumber(row.revenue),
          grossRevenue: this.toNumber(row.grossRevenue),
          adminRevenue: this.toNumber(row.adminRevenue),
          instructorRevenue: this.toNumber(row.instructorRevenue),
          enrollments: this.toNumber(row.enrollments),
        }),
      ),
      revenueSeriesSource: 'database',
      topCourses: (topCourseRows as RawTopCourseRow[]).map((row) => ({
        courseId: Number(row.courseId),
        courseName: row.courseName,
        revenue: this.toNumber(row.revenue),
        grossRevenue: this.toNumber(row.grossRevenue),
        adminRevenue: this.toNumber(row.adminRevenue),
        instructorRevenue: this.toNumber(row.instructorRevenue),
        enrollments: this.toNumber(row.enrollments),
        averageRating:
          this.toNumber(row.reviewCount) > 0
            ? Number(this.toNumber(row.averageRating).toFixed(1))
            : null,
        reviewCount: this.toNumber(row.reviewCount),
        ratingLabel:
          this.toNumber(row.reviewCount) > 0
            ? `${this.toNumber(row.reviewCount)} review`
            : 'Chua co review',
        imageUrl: row.imageUrl,
      })),
      topCoursesSource: 'database',
      recentEnrollments: (recentRows as RawRecentEnrollmentRow[]).map(
        (row) => ({
          enrollmentCode: row.enrollmentCode,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          studentAvatar: row.studentAvatar,
          courseId: Number(row.courseId),
          courseName: row.courseName,
          amount: this.toNumber(row.amount),
          grossAmount: this.toNumber(row.grossAmount),
          adminAmount: this.toNumber(row.adminAmount),
          instructorAmount: this.toNumber(row.instructorAmount),
          couponCode: row.couponCode,
          status: row.status,
          purchasedAt: row.purchasedAt,
        }),
      ),
      recentEnrollmentsSource: 'database',
      traffic: {
        revenueBySource: trafficItems,
        revenueBySourceLabel:
          this.toNumber(overviewRow.enrollments) > 0
            ? `Du lieu traffic hien tai dua tren ${this.toNumber(overviewRow.enrollments)} luot mua thanh cong`
            : 'Chua co du lieu traffic tu giao dich',
        revenueBySourceSource: 'database',
      },
    };
  }

  private buildPaidRevenueJoins() {
    return `
      JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
      JOIN HoaDon hd ON hd.MaHD = dk.MaHD AND hd.TrangThaiThanhToan = 'PAID'
      JOIN ChiTietHoaDon cthd ON cthd.MaHD = hd.MaHD AND cthd.MaKH = kh.MaKH
      LEFT JOIN MaGiamGia mg ON mg.MaCoupon = hd.MaCoupon
      JOIN (
        SELECT MaHD, COALESCE(SUM(GiaGhiNhan), 0) AS invoiceGross
        FROM ChiTietHoaDon
        GROUP BY MaHD
      ) invoiceTotals ON invoiceTotals.MaHD = hd.MaHD
    `;
  }

  private buildLineNetRevenueSql() {
    return `
      CASE
        WHEN invoiceTotals.invoiceGross > 0 AND hd.TongTien IS NOT NULL THEN
          CASE
            WHEN mg.MaCoupon IS NULL THEN COALESCE(cthd.GiaGhiNhan, kh.GiaBan, 0)
            WHEN mg.MaKH IS NULL THEN COALESCE(cthd.GiaGhiNhan, kh.GiaBan, 0) * hd.TongTien / invoiceTotals.invoiceGross
            WHEN mg.MaKH = cthd.MaKH THEN GREATEST(COALESCE(cthd.GiaGhiNhan, kh.GiaBan, 0) - GREATEST(invoiceTotals.invoiceGross - hd.TongTien, 0), 0)
            ELSE COALESCE(cthd.GiaGhiNhan, kh.GiaBan, 0)
          END
        ELSE COALESCE(cthd.GiaGhiNhan, kh.GiaBan, 0)
      END
    `;
  }

  private buildStudentQuery(
    instructorId: number,
    filters: InstructorStudentFilters,
  ) {
    let sql = `
        SELECT 
            dk.MaND AS studentId,
            nd.HoTen AS studentName,
            nd.Email AS studentEmail,
            dk.MaKH AS courseId,
            kh.TenKhoaHoc AS courseName,
            COALESCE(cthd.DoanhThuGiangVien, kh.GiaBan * ${INSTRUCTOR_REVENUE_SHARE}) AS coursePrice,
            dk.NgayDangKy AS purchasedAt
        FROM DangKyKhoaHoc dk
        JOIN NguoiDung nd ON dk.MaND = nd.MaND
        JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
        LEFT JOIN HoaDon hd ON dk.MaHD = hd.MaHD AND hd.TrangThaiThanhToan = 'PAID'
        LEFT JOIN ChiTietHoaDon cthd ON cthd.MaHD = dk.MaHD AND cthd.MaKH = dk.MaKH
        WHERE kh.MaND_GiangVien = ? AND dk.TrangThai = 'ACTIVE'
    `;

    const params: Array<number | string> = [instructorId];

    if (filters.courseId) {
      sql += ` AND kh.MaKH = ?`;
      params.push(filters.courseId);
    }

    if (filters.search) {
      sql += ` AND (nd.HoTen LIKE ? OR nd.Email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ` ORDER BY dk.NgayDangKy DESC`;

    return { sql, params };
  }

  private buildReportWhereClause(
    instructorId: number,
    courseId: number | undefined,
    range: InstructorReportRange,
  ) {
    const clauses = [
      `kh.MaND_GiangVien = ${instructorId}`,
      `dk.TrangThai = 'ACTIVE'`,
    ];

    if (courseId) {
      clauses.push(`kh.MaKH = ${courseId}`);
    }

    const rangeClause = this.getRangeClause(range, false);
    if (rangeClause) {
      clauses.push(rangeClause);
    }

    return clauses.join(' AND ');
  }

  private buildPreviousReportWhereClause(
    instructorId: number,
    courseId: number | undefined,
    range: InstructorReportRange,
  ) {
    const clauses = [
      `kh.MaND_GiangVien = ${instructorId}`,
      `dk.TrangThai = 'ACTIVE'`,
    ];

    if (courseId) {
      clauses.push(`kh.MaKH = ${courseId}`);
    }

    const rangeClause = this.getRangeClause(range, true);
    if (rangeClause) {
      clauses.push(rangeClause);
    } else {
      clauses.push('1 = 0');
    }

    return clauses.join(' AND ');
  }

  private buildReviewReportWhereClause(
    instructorId: number,
    courseId: number | undefined,
    range: InstructorReportRange,
  ) {
    const clauses = [`kh.MaND_GiangVien = ${instructorId}`, `dg.SoSao > 0`];

    if (courseId) {
      clauses.push(`kh.MaKH = ${courseId}`);
    }

    const rangeClause = this.getReviewRangeClause(range, false);
    if (rangeClause) {
      clauses.push(rangeClause);
    }

    return clauses.join(' AND ');
  }

  private buildCourseOwnershipClause(
    instructorId: number,
    courseId: number | undefined,
  ) {
    const clauses = [`kh.MaND_GiangVien = ${instructorId}`];

    if (courseId) {
      clauses.push(`kh.MaKH = ${courseId}`);
    }

    return clauses.join(' AND ');
  }

  private buildRejectedCourseClause(
    instructorId: number,
    courseId: number | undefined,
  ) {
    const clauses = [`kh.MaND_GiangVien = ${instructorId}`];

    if (courseId) {
      clauses.push(`kh.MaKH = ${courseId}`);
    }

    return clauses.join(' AND ');
  }

  private getReviewRangeClause(
    range: InstructorReportRange,
    previous: boolean,
  ) {
    switch (range) {
      case '30days':
        return previous
          ? `dg.ThoiGian >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND dg.ThoiGian < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`
          : `dg.ThoiGian >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
      case 'this_month':
        return previous
          ? `DATE_FORMAT(dg.ThoiGian, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')`
          : `DATE_FORMAT(dg.ThoiGian, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`;
      case 'last_month':
        return previous
          ? `DATE_FORMAT(dg.ThoiGian, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 2 MONTH), '%Y-%m')`
          : `DATE_FORMAT(dg.ThoiGian, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')`;
      case 'this_year':
        return previous
          ? `YEAR(dg.ThoiGian) = YEAR(CURRENT_DATE()) - 1`
          : `YEAR(dg.ThoiGian) = YEAR(CURRENT_DATE())`;
      case 'all_time':
      default:
        return previous ? '' : '';
    }
  }

  private getRangeClause(range: InstructorReportRange, previous: boolean) {
    switch (range) {
      case '30days':
        return previous
          ? `dk.NgayDangKy >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND dk.NgayDangKy < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`
          : `dk.NgayDangKy >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
      case 'this_month':
        return previous
          ? `DATE_FORMAT(dk.NgayDangKy, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')`
          : `DATE_FORMAT(dk.NgayDangKy, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`;
      case 'last_month':
        return previous
          ? `DATE_FORMAT(dk.NgayDangKy, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 2 MONTH), '%Y-%m')`
          : `DATE_FORMAT(dk.NgayDangKy, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')`;
      case 'this_year':
        return previous
          ? `YEAR(dk.NgayDangKy) = YEAR(CURRENT_DATE()) - 1`
          : `YEAR(dk.NgayDangKy) = YEAR(CURRENT_DATE())`;
      case 'all_time':
      default:
        return previous ? '' : '';
    }
  }

  private buildPeriodSelect(range: InstructorReportRange) {
    switch (range) {
      case '30days':
      case 'this_month':
      case 'last_month':
        return `DATE_FORMAT(dk.NgayDangKy, '%d/%m')`;
      case 'this_year':
      case 'all_time':
      default:
        return `DATE_FORMAT(dk.NgayDangKy, '%m/%Y')`;
    }
  }

  private calculateGrowth(current: number, previous: number) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private buildTrafficItems(
    rows: RawTrafficSourceRow[],
    totalOrders: number,
  ): InstructorReportsBoard['traffic']['revenueBySource'] {
    const colors: Record<string, string> = {
      Organic: '#0f766e',
      'Coupon / Promo': '#2563eb',
      Social: '#8b5cf6',
      Direct: '#f59e0b',
    };

    return rows.map((row) => {
      const orderCount = this.toNumber(row.orderCount);
      return {
        label: row.trafficSource ?? 'Unknown',
        percentage:
          totalOrders > 0
            ? Number(((orderCount * 100) / totalOrders).toFixed(0))
            : 0,
        color: colors[row.trafficSource ?? ''] ?? '#94a3b8',
        orderCount,
        grossRevenue: this.toNumber(row.grossRevenue),
      };
    });
  }

  private buildRatingDistribution(
    rows: RawRatingDistributionRow[],
    totalReviews: number,
  ): InstructorReportsBoard['quality']['ratingDistribution'] {
    const rowMap = new Map(
      rows.map((row) => [this.toNumber(row.rating), this.toNumber(row.count)]),
    );

    return [5, 4, 3, 2, 1].map((rating) => {
      const count = rowMap.get(rating) ?? 0;
      return {
        rating,
        count,
        percentage:
          totalReviews > 0
            ? Number(((count * 100) / totalReviews).toFixed(0))
            : 0,
      };
    });
  }

  private toIsoStringOrNull(value: string | Date | null | undefined) {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  private assertInstructor(principal: InstructorPrincipal) {
    if (principal.vaiTro !== UserRole.INSTRUCTOR) {
      throw new ForbiddenException(
        'Chi giang vien moi co quyen quan ly ho so va hoc vien.',
      );
    }
  }

  private getInstructorId(principal: InstructorPrincipal) {
    const instructorId = principal.maND ?? principal.sub;
    if (!instructorId) {
      throw new ForbiddenException('Khong xac dinh duoc giang vien hien tai.');
    }
    return instructorId;
  }

  async getProfile(principal: InstructorPrincipal) {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    const user = await this.userRepo.findOne({ where: { maND: instructorId } });
    if (!user) {
      throw new NotFoundException('Khong tim thay tai khoan nguoi dung.');
    }

    const profile = await this.hoSoRepo.findOne({
      where: { MaND: instructorId },
    });

    return {
      hoTen: user.hoTen,
      anhDaiDien: user.anhDaiDien,
      ...profile,
    };
  }

  async getAllPublicInstructors() {
    const instructors = await this.userRepo
      .createQueryBuilder('user')
      .where('user.vaiTro = :role', { role: UserRole.INSTRUCTOR })
      .getMany();

    const profiles = await this.hoSoRepo.find();

    return instructors.map((user) => {
      const profile = profiles.find((p) => p.MaND === user.maND);
      return {
        id: user.maND,
        personName: user.hoTen,
        personImage: user.anhDaiDien || 'team-3.jpg',
        personTitle: profile?.ChuyenMon || 'Giang vien',
        socialLinks: {
          facebook: profile?.FacebookURL || '',
          instagram: profile?.InstagramURL || '',
          github: profile?.GitHubURL || '',
          website: profile?.WebsiteURL || '',
        },
      };
    });
  }

  async getPublicInstructorById(id: number) {
    const user = await this.userRepo.findOne({
      where: { maND: id, vaiTro: UserRole.INSTRUCTOR },
    });
    if (!user) {
      throw new NotFoundException('Instructor not found');
    }

    const profile = await this.hoSoRepo.findOne({ where: { MaND: id } });

    const courses = await this.dataSource.query(
      `
        SELECT 
          MaKH as id,
          TenKhoaHoc as courseTitle,
          GiaBan as price,
          HinhThuNho as imgUrl,
          MoTa as courseDesc,
          0 as views
        FROM KhoaHoc
        WHERE MaND_GiangVien = ? AND TrangThai = 'PUBLISHED'
      `,
      [id],
    );

    return {
      id: user.maND,
      personName: user.hoTen,
      personImage: user.anhDaiDien || 'team-3.jpg',
      personTitle: profile?.ChuyenMon || 'Giang vien',
      email: user.email,
      phone: '',
      bio: profile?.TieuSu || 'Giang vien chua cap nhat tieu su.',
      socialLinks: {
        facebook: profile?.FacebookURL || '',
        instagram: profile?.InstagramURL || '',
        github: profile?.GitHubURL || '',
        website: profile?.WebsiteURL || '',
      },
      courses: courses.map((c: any) => ({
        ...c,
        price: Number(c.price),
        imgUrl: c.imgUrl || 'course-1.jpg',
      })),
    };
  }

  private toNumber(value: number | string | null | undefined) {
    return Number(value ?? 0);
  }
}
