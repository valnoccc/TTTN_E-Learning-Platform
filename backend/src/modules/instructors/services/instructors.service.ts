import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../users/entities/user.entity';

// LƯU Ý: Đảm bảo đường dẫn import các Entity và DTO này khớp với project của bạn
import { User } from '../../users/entities/user.entity';
import { HoSoGiangVien } from '../entities/ho-so-giang-vien.entity';
import { UpdateInstructorProfileDto } from '../dto/update-instructor-profile.dto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

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
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(HoSoGiangVien)
    private readonly hoSoRepo: Repository<HoSoGiangVien>,

    // THÊM: Inject dịch vụ Cloudinary vào đây
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateProfile(
    principal: InstructorPrincipal,
    dto: UpdateInstructorProfileDto,
    file?: Express.Multer.File,
  ) {
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    // 1. Cập nhật bảng NguoiDung (User)
    const user = await this.userRepo.findOne({ where: { maND: instructorId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    let isUserUpdated = false;
    if (dto.HoTen !== undefined) {
      user.hoTen = dto.HoTen;
      isUserUpdated = true;
    }

    // Nếu có file ảnh được truyền lên, tiến hành xóa ảnh cũ (nếu có) và đẩy ảnh mới lên Cloudinary
    if (file) {
      // --- TÍNH NĂNG MỚI: XÓA ẢNH CŨ TRÁNH RÁC CLOUDINARY ---
      if (user.anhDaiDien) {
        const oldPublicId = this.cloudinaryService.extractPublicId(
          user.anhDaiDien,
        );
        if (oldPublicId) {
          try {
            await this.cloudinaryService.deleteFile(oldPublicId, 'image');
          } catch (deleteError) {
            // Log lỗi ra console để theo dõi nhưng không chặn luồng xử lý chính nếu lỡ xóa thất bại
            console.error(
              'Lỗi khi xóa ảnh đại diện cũ trên Cloudinary:',
              deleteError,
            );
          }
        }
      }
      // -----------------------------------------------------

      const uploadResult = await this.cloudinaryService.uploadFile(file);
      user.anhDaiDien = uploadResult.secure_url || uploadResult.url;
      isUserUpdated = true;
    }

    if (isUserUpdated) {
      await this.userRepo.save(user);
    }

    // 2. Tìm hoặc Tạo mới HoSoGiangVien
    let profile = await this.hoSoRepo.findOne({
      where: { MaND: instructorId },
    });
    if (!profile) {
      profile = this.hoSoRepo.create({ MaND: instructorId });
    }

    // 3. Cập nhật các trường profile văn bản
    if (dto.TieuSu !== undefined) profile.TieuSu = dto.TieuSu;
    if (dto.ChuyenMon !== undefined) profile.ChuyenMon = dto.ChuyenMon;
    if (dto.SoTaiKhoan !== undefined) profile.SoTaiKhoan = dto.SoTaiKhoan;
    if (dto.FacebookURL !== undefined) profile.FacebookURL = dto.FacebookURL;
    if (dto.InstagramURL !== undefined) profile.InstagramURL = dto.InstagramURL;
    if (dto.GitHubURL !== undefined) profile.GitHubURL = dto.GitHubURL;
    if (dto.WebsiteURL !== undefined) profile.WebsiteURL = dto.WebsiteURL;

    await this.hoSoRepo.save(profile);

    return {
      message: 'Cập nhật trọn bộ hồ sơ thành công',
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
  ): Promise<any> {
    // Có thể đổi kiểu trả về thành InstructorStudentBoard sau
    this.assertInstructor(principal);
    const instructorId = this.getInstructorId(principal);

    let rows: any[] = [];

    try {
      const { sql, params } = this.buildStudentQuery(instructorId, filters);
      rows = await this.dataSource.query(sql, params);
    } catch (error) {
      console.error('Lỗi khi tải danh sách học viên:', error);
      return {
        totalStudents: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        students: [],
      };
    }

    // KHÔNG gom nhóm (Group) bằng Map nữa. Tạo trực tiếp danh sách phẳng.
    const flatStudentsList = rows.map((row) => ({
      studentId: Number(row.studentId),
      studentName: row.studentName,
      studentEmail: row.studentEmail,
      courseId: Number(row.courseId),
      courseName: row.courseName,
      totalSpent: this.toNumber(row.coursePrice),
      purchasedAt: row.purchasedAt,
      // Đảm bảo map thêm các trường cần cho việc chấm điểm
      githubLink: row.githubLink || null,
      status: row.status || 'NOT_SUBMITTED',
      score: row.score ? Number(row.score) : undefined,
      feedback: row.feedback || '',
    }));

    // Tính toán lại tổng quan
    // 1. Tính tổng số học viên duy nhất (dùng Set để đếm)
    const uniqueStudentIds = new Set(flatStudentsList.map((s) => s.studentId));

    // 2. Tính tổng doanh thu
    const totalRevenue = flatStudentsList.reduce(
      (sum, current) => sum + current.totalSpent,
      0,
    );

    return {
      totalStudents: uniqueStudentIds.size,
      totalPurchases: flatStudentsList.length,
      totalRevenue: totalRevenue,
      students: flatStudentsList, // Trả về danh sách phẳng để React dễ dàng lặp
    };
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================
  private buildStudentQuery(instructorId: number, filters: any) {
    // 1. Câu lệnh SQL nền tảng y hệt như bạn vừa test thành công
    let sql = `
        SELECT 
            dk.MaND AS studentId,
            nd.HoTen AS studentName,
            nd.Email AS studentEmail,
            dk.MaKH AS courseId,
            kh.TenKhoaHoc AS courseName,
            kh.GiaBan AS coursePrice,
            dk.NgayDangKy AS purchasedAt,
            bn.LinkGitHub AS githubLink,
            IFNULL(bn.TrangThai, 'NOT_SUBMITTED') AS status,
            bn.DiemSo AS score,
            bn.NhanXet AS feedback
        FROM DangKyKhoaHoc dk
        JOIN NguoiDung nd ON dk.MaND = nd.MaND
        JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
        LEFT JOIN DuAnCuoiKhoa da ON kh.MaKH = da.MaKH
        LEFT JOIN BaiNopDuAn bn ON da.MaDuAn = bn.MaDuAn AND bn.MaND = nd.MaND
        WHERE kh.MaND_GiangVien = ? AND dk.TrangThai = 'ACTIVE'
    `;

    // Tham số đầu tiên luôn là ID của giảng viên
    const params: any[] = [instructorId];

    // 2. Xử lý các bộ lọc từ Frontend truyền xuống
    if (filters.courseId) {
      sql += ` AND kh.MaKH = ?`;
      params.push(filters.courseId);
    }

    if (filters.status) {
      if (filters.status === 'NOT_SUBMITTED') {
        // Nếu chọn "Chưa nộp bài", nghĩa là chưa có record trong bảng BaiNopDuAn
        sql += ` AND bn.TrangThai IS NULL`;
      } else {
        // Các trạng thái khác: PENDING, PASSED, FAILED
        sql += ` AND bn.TrangThai = ?`;
        params.push(filters.status);
      }
    }

    if (filters.search) {
      // Tìm kiếm theo tên hoặc email học viên
      sql += ` AND (nd.HoTen LIKE ? OR nd.Email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // 3. Sắp xếp người mua mới nhất lên đầu
    sql += ` ORDER BY dk.NgayDangKy DESC`;

    return { sql, params };
  }
  private assertInstructor(principal: InstructorPrincipal) {
    if (principal.vaiTro !== UserRole.INSTRUCTOR) {
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
    if (!user)
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');

    // Lấy thông tin profile
    const profile = await this.hoSoRepo.findOne({
      where: { MaND: instructorId },
    });

    // Gộp data lại và trả về cho Frontend
    return {
      hoTen: user.hoTen,
      anhDaiDien: user.anhDaiDien,
      ...profile, // Trải phẳng TieuSu, ChuyenMon, FacebookURL... ra ngoài
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
        personTitle: profile?.ChuyenMon || 'Giảng viên',
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
    const user = await this.userRepo.findOne({ where: { maND: id, vaiTro: UserRole.INSTRUCTOR } });
    if (!user) {
      throw new NotFoundException('Instructor not found');
    }

    const profile = await this.hoSoRepo.findOne({ where: { MaND: id } });

    // Lấy danh sách khóa học của giảng viên này
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
        WHERE MaND_GiangVien = ? AND TrangThai = 'ACTIVE'
      `,
      [id]
    );

    return {
      id: user.maND,
      personName: user.hoTen,
      personImage: user.anhDaiDien || 'team-3.jpg',
      personTitle: profile?.ChuyenMon || 'Giảng viên',
      email: user.email,
      phone: '', // Có thể thêm trường số điện thoại vào db sau
      bio: profile?.TieuSu || 'Giảng viên chưa cập nhật tiểu sử.',
      socialLinks: {
        facebook: profile?.FacebookURL || '',
        instagram: profile?.InstagramURL || '',
        github: profile?.GitHubURL || '',
        website: profile?.WebsiteURL || '',
      },
      courses: courses.map((c: any) => ({
        ...c,
        price: Number(c.price),
        imgUrl: c.imgUrl || 'course-1.jpg'
      }))
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
