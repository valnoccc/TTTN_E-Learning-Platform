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
  enrollments: number;
}

export interface InstructorTopCourseReport {
  courseId: number;
  courseName: string;
  revenue: number;
  enrollments: number;
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
    revenueGrowth: number;
    newEnrollments: number;
    enrollmentGrowth: number;
    averageRating: number | null;
    averageRatingLabel: string;
    averageRatingSource: 'mockdata';
    completionRate: number | null;
    completionRateLabel: string;
    completionRateSource: 'mockdata';
  };
  revenueSeries: InstructorRevenuePoint[];
  revenueSeriesSource: 'database';
  topCourses: InstructorTopCourseReport[];
  topCoursesSource: 'database';
  recentEnrollments: InstructorRecentEnrollment[];
  recentEnrollmentsSource: 'database';
  revenueBySource: Array<{
    label: string;
    percentage: number;
    color: string;
  }>;
  revenueBySourceLabel: string;
  revenueBySourceSource: 'mockdata';
}

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
  enrollments: number | string | null;
};

type RawTopCourseRow = {
  courseId: number | string;
  courseName: string;
  revenue: number | string | null;
  enrollments: number | string | null;
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
      rows = (await this.dataSource.query(sql, params)) as RawStudentRow[];
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

    const whereClause = this.buildReportWhereClause(instructorId, courseId, range);
    const previousWhereClause = this.buildPreviousReportWhereClause(
      instructorId,
      courseId,
      range,
    );

    const [overviewRows, previousRows, revenueSeriesRows, topCourseRows, recentRows] =
      await Promise.all([
        this.dataSource.query(
          `
            SELECT
              COUNT(*) AS enrollments,
              COALESCE(SUM(kh.GiaBan), 0) AS revenue
            FROM DangKyKhoaHoc dk
            JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
            WHERE ${whereClause}
          `,
        ),
        this.dataSource.query(
          `
            SELECT
              COUNT(*) AS enrollments,
              COALESCE(SUM(kh.GiaBan), 0) AS revenue
            FROM DangKyKhoaHoc dk
            JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
            WHERE ${previousWhereClause}
          `,
        ),
        this.dataSource.query(
          `
            SELECT
              ${this.buildPeriodSelect(range)} AS periodLabel,
              COALESCE(SUM(kh.GiaBan), 0) AS revenue,
              COUNT(*) AS enrollments
            FROM DangKyKhoaHoc dk
            JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
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
              COALESCE(SUM(kh.GiaBan), 0) AS revenue,
              COUNT(*) AS enrollments,
              kh.HinhThuNho AS imageUrl
            FROM DangKyKhoaHoc dk
            JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
            WHERE ${whereClause}
            GROUP BY kh.MaKH, kh.TenKhoaHoc, kh.HinhThuNho
            ORDER BY revenue DESC, enrollments DESC, kh.MaKH DESC
            LIMIT 5
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
              kh.GiaBan AS amount,
              NULL AS couponCode,
              dk.TrangThai AS status,
              dk.NgayDangKy AS purchasedAt
            FROM DangKyKhoaHoc dk
            JOIN NguoiDung nd ON dk.MaND = nd.MaND
            JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
            WHERE ${whereClause}
            ORDER BY dk.NgayDangKy DESC
            LIMIT 8
          `,
        ),
      ]);

    const overviewRow = (overviewRows as Array<{ enrollments?: number | string; revenue?: number | string }>)[0] ?? {
      enrollments: 0,
      revenue: 0,
    };
    const previousRow = (previousRows as Array<{ enrollments?: number | string; revenue?: number | string }>)[0] ?? {
      enrollments: 0,
      revenue: 0,
    };

    return {
      filters: {
        courseId: courseId ?? null,
        range,
      },
      overview: {
        totalRevenue: this.toNumber(overviewRow.revenue),
        revenueGrowth: this.calculateGrowth(
          this.toNumber(overviewRow.revenue),
          this.toNumber(previousRow.revenue),
        ),
        newEnrollments: this.toNumber(overviewRow.enrollments),
        enrollmentGrowth: this.calculateGrowth(
          this.toNumber(overviewRow.enrollments),
          this.toNumber(previousRow.enrollments),
        ),
        averageRating: null,
        averageRatingLabel: 'MOCKDATA: Chua co du lieu danh gia that',
        averageRatingSource: 'mockdata',
        completionRate: null,
        completionRateLabel: 'MOCKDATA: Chua co du lieu tien do that',
        completionRateSource: 'mockdata',
      },
      revenueSeries: (revenueSeriesRows as RawRevenueSeriesRow[]).map((row) => ({
        label: row.periodLabel,
        revenue: this.toNumber(row.revenue),
        enrollments: this.toNumber(row.enrollments),
      })),
      revenueSeriesSource: 'database',
      topCourses: (topCourseRows as RawTopCourseRow[]).map((row) => ({
        courseId: Number(row.courseId),
        courseName: row.courseName,
        revenue: this.toNumber(row.revenue),
        enrollments: this.toNumber(row.enrollments),
        ratingLabel: 'MOCKDATA',
        imageUrl: row.imageUrl,
      })),
      topCoursesSource: 'database',
      recentEnrollments: (recentRows as RawRecentEnrollmentRow[]).map((row) => ({
        enrollmentCode: row.enrollmentCode,
        studentName: row.studentName,
        studentEmail: row.studentEmail,
        studentAvatar: row.studentAvatar,
        courseId: Number(row.courseId),
        courseName: row.courseName,
        amount: this.toNumber(row.amount),
        couponCode: row.couponCode,
        status: row.status,
        purchasedAt: row.purchasedAt,
      })),
      recentEnrollmentsSource: 'database',
      revenueBySource: [
        { label: 'MOCKDATA: Tu nhien', percentage: 55, color: '#94a3b8' },
        { label: 'MOCKDATA: Coupon', percentage: 30, color: '#10b981' },
        { label: 'MOCKDATA: Social', percentage: 15, color: '#3b82f6' },
      ],
      revenueBySourceLabel: 'MOCKDATA: Chua co tracking nguon doanh thu that',
      revenueBySourceSource: 'mockdata',
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
            kh.GiaBan AS coursePrice,
            dk.NgayDangKy AS purchasedAt
        FROM DangKyKhoaHoc dk
        JOIN NguoiDung nd ON dk.MaND = nd.MaND
        JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
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
    const clauses = [`kh.MaND_GiangVien = ${instructorId}`, `dk.TrangThai = 'ACTIVE'`];

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
    const clauses = [`kh.MaND_GiangVien = ${instructorId}`, `dk.TrangThai = 'ACTIVE'`];

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
