import { DataSource } from 'typeorm';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

export interface InstructorPrincipal {
  maND?: number;
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
  constructor(private readonly dataSource: DataSource) { }

  async getMyCourses(principal: InstructorPrincipal): Promise<InstructorCourseOption[]> {
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

      const courseExists = existing.courses.some((course) => course.courseId === courseId);
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

      if (this.toTimestamp(purchaseAt) > this.toTimestamp(existing.lastPurchasedAt)) {
        existing.lastPurchasedAt = purchaseAt;
      }
    }

    const students = Array.from(grouped.values()).sort(
      (left, right) => this.toTimestamp(right.lastPurchasedAt) - this.toTimestamp(left.lastPurchasedAt),
    );

    return {
      totalStudents: students.length,
      totalPurchases: rows.length,
      totalRevenue: students.reduce((sum, student) => sum + student.totalSpent, 0),
      students,
    };
  }

  private buildStudentQuery(instructorId: number, filters: InstructorStudentFilters) {
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
      throw new ForbiddenException('Chỉ giảng viên mới có quyền quản lý học viên.');
    }
  }

  private getInstructorId(principal: InstructorPrincipal) {
    const instructorId = principal.maND ?? principal.sub;
    if (!instructorId) {
      throw new ForbiddenException('Không xác định được giảng viên hiện tại.');
    }
    return instructorId;
  }

  private toNumber(value: number | string | null | undefined) {
    return Number(value ?? 0);
  }

  private toTimestamp(value: string) {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
