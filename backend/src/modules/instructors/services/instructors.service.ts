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
