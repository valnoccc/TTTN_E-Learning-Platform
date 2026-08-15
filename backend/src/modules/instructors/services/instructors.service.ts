import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { User, UserRole } from '../../users/entities/user.entity';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';
import { HoSoGiangVien } from '../entities/ho-so-giang-vien.entity';
import { InstructorProfileDetailsService } from './instructor-profile-details.service';

export interface InstructorPrincipal {
  maND?: number;
  sub?: number;
  vaiTro?: UserRole;
}

export interface InstructorCourseOption {
  courseId: number;
  courseName: string;
  coursePrice: number;
  status: string;
  createdAt: string;
}

export interface InstructorTransactionFilters {
  courseId?: number;
  search?: string;
}

export interface InstructorTransaction {
  invoiceId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  transactionAmount: number;
  instructorAmount: number;
  paymentMethod: string | null;
  purchasedAt: string;
  paymentStatus: string;
}

export interface InstructorTransactionBoard {
  totalTransactions: number;
  totalGrossRevenue: number;
  totalInstructorRevenue: number;
  transactions: InstructorTransaction[];
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

type RawTransactionRow = {
  invoiceId: number | string;
  studentId: number | string;
  studentName: string;
  studentEmail: string;
  courseId: number | string;
  courseName: string;
  transactionAmount: number | string | null;
  instructorAmount: number | string | null;
  paymentMethod: string | null;
  purchasedAt: string;
  paymentStatus: string;
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
    private readonly profileDetailsService: InstructorProfileDetailsService,
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
    if (dto.MaNganHang !== undefined) profile.MaNganHang = dto.MaNganHang;
    if (dto.TenNganHang !== undefined) profile.TenNganHang = dto.TenNganHang;
    if (dto.TenChuTaiKhoan !== undefined) profile.TenChuTaiKhoan = dto.TenChuTaiKhoan;
    if (dto.FacebookURL !== undefined) profile.FacebookURL = dto.FacebookURL;
    if (dto.InstagramURL !== undefined) profile.InstagramURL = dto.InstagramURL;
    if (dto.GitHubURL !== undefined) profile.GitHubURL = dto.GitHubURL;
    if (dto.WebsiteURL !== undefined) profile.WebsiteURL = dto.WebsiteURL;

    await this.hoSoRepo.save(profile);

    if (dto.BangCaps !== undefined || dto.KinhNghiems !== undefined) {
      await this.profileDetailsService.replaceDetails(profile.MaHoSo, {
        qualifications: dto.BangCaps,
        experiences: dto.KinhNghiems,
      });
    }

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

  async getMyTransactions(
    principal: InstructorPrincipal,
    filters: InstructorTransactionFilters,
  ): Promise<InstructorTransactionBoard> {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);
    const params: Array<number | string> = [instructorId];
    let sql = `
      SELECT
        hd.MaHD AS invoiceId,
        nd.MaND AS studentId,
        nd.HoTen AS studentName,
        nd.Email AS studentEmail,
        kh.MaKH AS courseId,
        kh.TenKhoaHoc AS courseName,
        CASE
          WHEN cthd.DoanhThuGiangVien IS NOT NULL
            AND cthd.TiLeGiangVien IS NOT NULL
            AND cthd.TiLeGiangVien > 0
            THEN cthd.DoanhThuGiangVien * 100 / cthd.TiLeGiangVien
          ELSE COALESCE(cthd.GiaGhiNhan, kh.GiaBan, 0)
        END AS transactionAmount,
        COALESCE(cthd.DoanhThuGiangVien, 0) AS instructorAmount,
        hd.PhuongThucThanhToan AS paymentMethod,
        COALESCE(hd.NgayThanhToan, hd.NgayLap) AS purchasedAt,
        hd.TrangThaiThanhToan AS paymentStatus
      FROM HoaDon hd
      INNER JOIN NguoiDung nd ON nd.MaND = hd.MaND
      INNER JOIN ChiTietHoaDon cthd ON cthd.MaHD = hd.MaHD
      INNER JOIN KhoaHoc kh ON kh.MaKH = cthd.MaKH
      WHERE kh.MaND_GiangVien = ?
        AND hd.TrangThaiThanhToan = 'PAID'
    `;

    if (filters.courseId) {
      sql += ` AND kh.MaKH = ?`;
      params.push(filters.courseId);
    }

    if (filters.search) {
      sql += ` AND (nd.HoTen LIKE ? OR nd.Email LIKE ?)`;
      const search = `%${filters.search}%`;
      params.push(search, search);
    }

    sql += ` ORDER BY COALESCE(hd.NgayThanhToan, hd.NgayLap) DESC, hd.MaHD DESC`;

    let rows: RawTransactionRow[] = [];
    try {
      rows = await this.dataSource.query(sql, params);
    } catch (error) {
      console.error('Loi khi tai giao dich cua giang vien:', error);
    }

    const transactions = rows.map((row) => ({
      invoiceId: Number(row.invoiceId),
      studentId: Number(row.studentId),
      studentName: row.studentName,
      studentEmail: row.studentEmail,
      courseId: Number(row.courseId),
      courseName: row.courseName,
      transactionAmount: this.toNumber(row.transactionAmount),
      instructorAmount: this.toNumber(row.instructorAmount),
      paymentMethod: row.paymentMethod,
      purchasedAt: row.purchasedAt,
      paymentStatus: row.paymentStatus,
    }));

    return {
      totalTransactions: transactions.length,
      totalGrossRevenue: transactions.reduce(
        (total, transaction) => total + transaction.transactionAmount,
        0,
      ),
      totalInstructorRevenue: transactions.reduce(
        (total, transaction) => total + transaction.instructorAmount,
        0,
      ),
      transactions,
    };
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
    const details = profile ? await this.profileDetailsService.getDetails(profile.MaHoSo) : { qualifications: [], experiences: [] };

    return {
      hoTen: user.hoTen,
      anhDaiDien: user.anhDaiDien,
      ...profile,
      bangCaps: details.qualifications,
      kinhNghiems: details.experiences,
    };
  }

  async getAllPublicInstructors() {
    const instructors = await this.userRepo
  .createQueryBuilder('user')
  .where('user.vaiTro = :role', { role: UserRole.INSTRUCTOR })
  .andWhere(`
    EXISTS (
      SELECT 1
      FROM KhoaHoc kh
      WHERE kh.MaND_GiangVien = user.maND
        AND kh.TrangThai = :publishedStatus
    )
  `, { publishedStatus: 'PUBLISHED' })
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
    const details = profile ? await this.profileDetailsService.getDetails(profile.MaHoSo) : { qualifications: [], experiences: [] };

    const courses = await this.dataSource.query(
      `
        SELECT 
          kh.MaKH as id,
          kh.TenKhoaHoc as courseTitle,
          kh.GiaBan as price,
          kh.HinhThuNho as imgUrl,
          kh.MoTa as courseDesc,
          COALESCE(lessonStats.totalDurationSeconds, 0) as totalDurationSeconds,
          COALESCE(lessonStats.lessonCount, 0) as lessonCount,
          COALESCE(reviewStats.averageRating, 0) as averageRating,
          COALESCE(reviewStats.reviewCount, 0) as reviewCount,
          COALESCE(enrollmentStats.totalStudents, 0) as views
        FROM KhoaHoc kh
        LEFT JOIN (
          SELECT
            ch.MaKH as maKH,
            COUNT(bh.MaBH) as lessonCount,
            COALESCE(SUM(CASE WHEN bh.TrangThai = 'ACTIVE' THEN bh.ThoiLuong ELSE 0 END), 0) as totalDurationSeconds
          FROM ChuongHoc ch
          LEFT JOIN BaiHoc bh ON bh.MaChuong = ch.MaChuong
          GROUP BY ch.MaKH
        ) lessonStats ON lessonStats.maKH = kh.MaKH
        LEFT JOIN (
          SELECT
            dg.MaKH as maKH,
            ROUND(AVG(dg.SoSao), 1) as averageRating,
            COUNT(*) as reviewCount
          FROM DanhGiaKhoaHoc dg
          WHERE dg.SoSao > 0 AND dg.MaDanhGiaCha IS NULL
          GROUP BY dg.MaKH
        ) reviewStats ON reviewStats.maKH = kh.MaKH
        LEFT JOIN (
          SELECT
            dk.MaKH as maKH,
            COUNT(DISTINCT dk.MaND) as totalStudents
          FROM DangKyKhoaHoc dk
          WHERE dk.TrangThai = 'ACTIVE'
          GROUP BY dk.MaKH
        ) enrollmentStats ON enrollmentStats.maKH = kh.MaKH
        WHERE kh.MaND_GiangVien = ? AND kh.TrangThai = 'PUBLISHED'
        ORDER BY kh.MaKH DESC
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
      qualifications: details.qualifications,
      experiences: details.experiences,
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
        totalDurationSeconds: Number(c.totalDurationSeconds ?? 0),
        lessonCount: Number(c.lessonCount ?? 0),
        averageRating: c.averageRating == null ? 0 : Number(c.averageRating),
        reviewCount: Number(c.reviewCount ?? 0),
        views: Number(c.views ?? 0),
      })),
    };
  }

  private toNumber(value: number | string | null | undefined) {
    return Number(value ?? 0);
  }
}
