import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../users/entities/user.entity';

// LƯU Ý: Đảm bảo đường dẫn import các Entity và DTO này khớp với project của bạn
import { User } from '../../users/entities/user.entity';
import { HoSoGiangVien } from '../entities/ho-so-giang-vien.entity';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';

export interface InstructorPrincipal {
  maND?: number; S
  sub?: number;
  vaiTro?: UserRole;
  role?: UserRole;
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
  totalCourses: number;
  totalSpent: number;
  lastPurchasedAt: string;
  courses: InstructorStudentCourse[];
}

export interface InstructorStudentBoard {
  totalStudents: number;
  totalPurchases: number;
  totalRevenue: number;
  students: InstructorStudentSummary[];
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

@Injectable()
export class InstructorsService {
  constructor(
    // Giữ nguyên DataSource cho các query SELECT phức tạp
    private readonly dataSource: DataSource,

    // Inject thêm các Repository để dùng cho việc Update Profile
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(HoSoGiangVien)
    private readonly hoSoRepo: Repository<HoSoGiangVien>,
  ) { }

  async updateProfile(principal: InstructorPrincipal, dto: UpdateInstructorProfileDto) {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    // 1. Cập nhật bảng NguoiDung (HoTen, AnhDaiDien)
    // Đã sửa 'nguoiDungRepo' thành 'userRepo' cho khớp với constructor của bạn
    const user = await this.userRepo.findOne({ where: { maND: instructorId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    let isUserUpdated = false;
    if (dto.HoTen !== undefined) {
      user.hoTen = dto.HoTen;
      isUserUpdated = true;
    }
    if (dto.AnhDaiDien !== undefined) {
      user.anhDaiDien = dto.AnhDaiDien;
      isUserUpdated = true;
    }

    if (isUserUpdated) {
      await this.userRepo.save(user);
    }

    // 2. Tìm hoặc Tạo mới HoSoGiangVien (Khôi phục đoạn code khai báo biến profile)
    let profile = await this.hoSoRepo.findOne({ where: { MaND: instructorId } });

    if (!profile) {
      profile = this.hoSoRepo.create({ MaND: instructorId });
    }

    // 3. Cập nhật các trường profile
    if (dto.TieuSu !== undefined) profile.TieuSu = dto.TieuSu;
    if (dto.ChuyenMon !== undefined) profile.ChuyenMon = dto.ChuyenMon;
    if (dto.SoTaiKhoan !== undefined) profile.SoTaiKhoan = dto.SoTaiKhoan;
    if (dto.FacebookURL !== undefined) profile.FacebookURL = dto.FacebookURL;
    if (dto.InstagramURL !== undefined) profile.InstagramURL = dto.InstagramURL;
    if (dto.GitHubURL !== undefined) profile.GitHubURL = dto.GitHubURL;
    if (dto.WebsiteURL !== undefined) profile.WebsiteURL = dto.WebsiteURL;

    await this.hoSoRepo.save(profile);

    return {
      message: 'Cập nhật hồ sơ thành công',
      user: {
        HoTen: user.hoTen,
        AnhDaiDien: user.anhDaiDien,
      },
      profile, // Lỗi báo đỏ ở đây sẽ biến mất vì 'profile' đã được khai báo ở bước 2
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
      console.error('Failed to load instructor students', error);
      return {
        totalStudents: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        students: [],
      };
    }

    const grouped = new Map<number, InstructorStudentSummary>();

    for (const row of rows) {
      const studentId = Number(row.studentId);
      const courseId = Number(row.courseId);
      const coursePrice = this.toNumber(row.coursePrice);

      const existing = grouped.get(studentId);
      const purchaseAt = row.purchasedAt;

      if (!existing) {
        grouped.set(studentId, {
          studentId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          totalCourses: 1,
          totalSpent: coursePrice,
          lastPurchasedAt: purchaseAt,
          courses: [
            {
              courseId,
              courseName: row.courseName,
              coursePrice,
              purchasedAt: purchaseAt,
            },
          ],
        });
        continue;
      }

      const courseExists = existing.courses.some(
        (course) => course.courseId === courseId,
      );
      if (!courseExists) {
        existing.courses.push({
          courseId,
          courseName: row.courseName,
          coursePrice,
          purchasedAt: purchaseAt,
        });
        existing.totalCourses += 1;
        existing.totalSpent += coursePrice;
      }

      if (
        this.toTimestamp(purchaseAt) >
        this.toTimestamp(existing.lastPurchasedAt)
      ) {
        existing.lastPurchasedAt = purchaseAt;
      }
    }

    const students = Array.from(grouped.values()).sort(
      (left, right) =>
        this.toTimestamp(right.lastPurchasedAt) -
        this.toTimestamp(left.lastPurchasedAt),
    );

    return {
      totalStudents: students.length,
      totalPurchases: rows.length,
      totalRevenue: students.reduce(
        (sum, student) => sum + student.totalSpent,
        0,
      ),
      students,
    };
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================
  private buildStudentQuery(
    instructorId: number,
    filters: InstructorStudentFilters,
  ) {
    const clauses = ['kh.MaND_GiangVien = ?'];
    const params: Array<number | string> = [instructorId];

    if (filters.courseId) {
      clauses.push('kh.MaKH = ?');
      params.push(filters.courseId);
    }

    if (filters.search) {
      clauses.push('(u.HoTen LIKE ? OR u.Email LIKE ?)');
      const keyword = `%${filters.search}%`;
      params.push(keyword, keyword);
    }

    return {
      sql: `
        SELECT
          u.MaND AS studentId,
          u.HoTen AS studentName,
          u.Email AS studentEmail,
          kh.MaKH AS courseId,
          kh.TenKhoaHoc AS courseName,
          COALESCE(ct.GiaGhiNhan, kh.GiaBan, 0) AS coursePrice,
          hd.NgayLap AS purchasedAt
        FROM ChiTietHoaDon ct
        INNER JOIN KhoaHoc kh ON kh.MaKH = ct.MaKH
        INNER JOIN HoaDon hd ON hd.MaHD = ct.MaHD
        INNER JOIN NguoiDung u ON u.MaND = hd.MaND
        WHERE ${clauses.join(' AND ')}
        ORDER BY purchasedAt DESC, u.HoTen ASC
      `,
      params,
    };
  }

  private assertInstructor(principal: InstructorPrincipal) {
    const role = principal.vaiTro ?? principal.role;
    if (role !== UserRole.INSTRUCTOR) {
      throw new ForbiddenException(
        'Chỉ giảng viên mới có quyền quản lý hồ sơ và học viên.',
      );
    }
  }

  private getInstructorId(principal: InstructorPrincipal) {
    const instructorId = principal.maND ?? principal.sub;
    if (!instructorId) {
      throw new ForbiddenException('Không xác định được giảng viên hiện tại.');
    }
    return instructorId;
  }

  async getProfile(principal: InstructorPrincipal) {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    // Lấy thông tin user (HoTen, AnhDaiDien)
    const user = await this.userRepo.findOne({ where: { maND: instructorId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng.');

    // Lấy thông tin profile
    const profile = await this.hoSoRepo.findOne({ where: { MaND: instructorId } });

    // Gộp data lại và trả về cho Frontend
    return {
      hoTen: user.hoTen,
      anhDaiDien: user.anhDaiDien,
      ...profile, // Trải phẳng TieuSu, ChuyenMon, FacebookURL... ra ngoài
    };
  }

  private toNumber(value: number | string | null | undefined) {
    return Number(value ?? 0);
  }

  private toTimestamp(value: string) {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}