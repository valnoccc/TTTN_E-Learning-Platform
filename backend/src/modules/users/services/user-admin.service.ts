import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '../entities/user.entity';

export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';
export type AdminUserRole = UserRole;

export interface AdminUsersQuery {
  search?: string;
  role?: string;
  status?: string;
}

export interface AdminUserListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  avatar: string | null;
  createdAt: string;
  activeEnrollments: number;
  purchaseCount: number;
  totalSpent: number;
}

export interface AdminUserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  deletedUsers: number;
  admins: number;
  instructors: number;
  students: number;
}

const USER_STATUSES: AdminUserStatus[] = ['ACTIVE', 'INACTIVE', 'DELETED'];
const USER_ROLES: AdminUserRole[] = [
  UserRole.ADMIN,
  UserRole.INSTRUCTOR,
  UserRole.STUDENT,
];

const DB_STATUS_BY_API_STATUS: Record<AdminUserStatus, string[]> = {
  ACTIVE: ['ACTIVE'],
  INACTIVE: ['INACTIVE', 'LOCKED'],
  DELETED: ['DELETED'],
};

const API_STATUS_BY_DB_STATUS: Record<string, AdminUserStatus> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LOCKED: 'INACTIVE',
  DELETED: 'DELETED',
};

@Injectable()
export class UserAdminService {
  constructor(private readonly dataSource: DataSource) {}

  async getUsers(query: AdminUsersQuery) {
    const filters = this.normalizeFilters(query);
    const statusDbStatuses = filters.statusDbStatuses ?? [];
    const [rows, summaryRows] = await Promise.all([
      this.dataSource.query(
        `
          SELECT
            nd.MaND AS id,
            nd.HoTen AS fullName,
            nd.Email AS email,
            nd.SoDienThoai AS phone,
            nd.VaiTro AS role,
            COALESCE(nd.TrangThai, 'ACTIVE') AS status,
            nd.AnhDaiDien AS avatar,
            nd.NgayTao AS createdAt,
            (
              SELECT COUNT(*)
              FROM DangKyKhoaHoc dk
              WHERE dk.MaND = nd.MaND AND dk.TrangThai = 'ACTIVE'
            ) AS activeEnrollments,
            (
              SELECT COUNT(*)
              FROM HoaDon hd
              WHERE hd.MaND = nd.MaND AND hd.TrangThaiThanhToan = 'PAID'
            ) AS purchaseCount,
            (
              SELECT IFNULL(SUM(hd2.TongTien), 0)
              FROM HoaDon hd2
              WHERE hd2.MaND = nd.MaND AND hd2.TrangThaiThanhToan = 'PAID'
            ) AS totalSpent
          FROM NguoiDung nd
          WHERE 1 = 1
            ${filters.search ? 'AND (nd.HoTen LIKE ? OR nd.Email LIKE ? OR nd.SoDienThoai LIKE ?)' : ''}
            ${filters.role ? 'AND nd.VaiTro = ?' : ''}
            ${
              filters.status
                ? `AND COALESCE(nd.TrangThai, 'ACTIVE') IN (${statusDbStatuses.map(() => '?').join(', ')})`
                : ''
            }
          ORDER BY nd.NgayTao DESC, nd.MaND DESC
        `,
        filters.params,
      ),
      this.dataSource.query(`
        SELECT
          COUNT(*) AS totalUsers,
          SUM(CASE WHEN COALESCE(TrangThai, 'ACTIVE') = 'ACTIVE' THEN 1 ELSE 0 END) AS activeUsers,
          SUM(CASE WHEN COALESCE(TrangThai, 'ACTIVE') IN ('INACTIVE', 'LOCKED') THEN 1 ELSE 0 END) AS inactiveUsers,
          SUM(CASE WHEN COALESCE(TrangThai, 'ACTIVE') = 'DELETED' THEN 1 ELSE 0 END) AS deletedUsers,
          SUM(CASE WHEN VaiTro = 'ADMIN' THEN 1 ELSE 0 END) AS admins,
          SUM(CASE WHEN VaiTro = 'INSTRUCTOR' THEN 1 ELSE 0 END) AS instructors,
          SUM(CASE WHEN VaiTro = 'STUDENT' THEN 1 ELSE 0 END) AS students
        FROM NguoiDung
      `),
    ]);

    return {
      message: 'Lấy danh sách người dùng thành công.',
      data: rows.map((row: any) => this.mapUserRow(row)),
      summary: this.mapSummary(summaryRows[0] ?? {}),
    };
  }

  async updateUserStatus(userId: number, status: string) {
    const normalizedStatus = this.normalizeStatus(status);
    const existing = await this.findUserRow(userId);

    if (!existing) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    await this.dataSource.query(
      'UPDATE NguoiDung SET TrangThai = ? WHERE MaND = ?',
      [this.mapStatusToDb(normalizedStatus), userId],
    );

    return {
      message: 'Cập nhật trạng thái người dùng thành công.',
      data: {
        id: userId,
        status: normalizedStatus,
      },
    };
  }

  async updateUserRole(userId: number, role: string) {
    const normalizedRole = this.normalizeRole(role);
    const existing = await this.findUserRow(userId);

    if (!existing) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    await this.dataSource.query(
      'UPDATE NguoiDung SET VaiTro = ? WHERE MaND = ?',
      [normalizedRole, userId],
    );

    return {
      message: 'Cập nhật vai trò người dùng thành công.',
      data: {
        id: userId,
        role: normalizedRole,
      },
    };
  }

  async bulkUpdateStatus(ids: number[], status: string) {
    const normalizedStatus = this.normalizeStatus(status);
    const normalizedIds = this.normalizeIds(ids);

    if (normalizedIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một người dùng.');
    }

    await this.dataSource.query(
      `UPDATE NguoiDung SET TrangThai = ? WHERE MaND IN (${normalizedIds.map(() => '?').join(', ')})`,
      [this.mapStatusToDb(normalizedStatus), ...normalizedIds],
    );

    return {
      message: 'Cập nhật trạng thái hàng loạt thành công.',
      data: {
        ids: normalizedIds,
        status: normalizedStatus,
      },
    };
  }

  async bulkUpdateRole(ids: number[], role: string) {
    const normalizedRole = this.normalizeRole(role);
    const normalizedIds = this.normalizeIds(ids);

    if (normalizedIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một người dùng.');
    }

    await this.dataSource.query(
      `UPDATE NguoiDung SET VaiTro = ? WHERE MaND IN (${normalizedIds.map(() => '?').join(', ')})`,
      [normalizedRole, ...normalizedIds],
    );

    return {
      message: 'Cập nhật vai trò hàng loạt thành công.',
      data: {
        ids: normalizedIds,
        role: normalizedRole,
      },
    };
  }

  private async findUserRow(userId: number) {
    const rows = await this.dataSource.query(
      `
        SELECT MaND
        FROM NguoiDung
        WHERE MaND = ?
        LIMIT 1
      `,
      [userId],
    );

    return rows[0] ?? null;
  }

  private normalizeFilters(query: AdminUsersQuery) {
    const params: Array<string | number> = [];
    const search = query.search?.trim();
    const role = query.role?.trim().toUpperCase();
    const status = query.status?.trim().toUpperCase();

    if (search) {
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    if (role && role !== 'ALL') {
      if (!USER_ROLES.includes(role as AdminUserRole)) {
        throw new BadRequestException('Vai trò không hợp lệ.');
      }
      params.push(role);
    }

    if (status && status !== 'ALL') {
      if (!USER_STATUSES.includes(status as AdminUserStatus)) {
        throw new BadRequestException('Trạng thái không hợp lệ.');
      }
      params.push(status);
    }

    return {
      search,
      role: role && role !== 'ALL' ? role : null,
      status: status && status !== 'ALL' ? status : null,
      statusDbStatuses:
        status && status !== 'ALL'
          ? DB_STATUS_BY_API_STATUS[status as AdminUserStatus]
          : null,
      params,
    };
  }

  private normalizeStatus(status: string) {
    const normalized = status?.trim().toUpperCase();
    if (!USER_STATUSES.includes(normalized as AdminUserStatus)) {
      throw new BadRequestException('Trạng thái không hợp lệ.');
    }
    return normalized as AdminUserStatus;
  }

  private normalizeRole(role: string) {
    const normalized = role?.trim().toUpperCase();
    if (!USER_ROLES.includes(normalized as AdminUserRole)) {
      throw new BadRequestException('Vai trò không hợp lệ.');
    }
    return normalized as AdminUserRole;
  }

  private normalizeIds(ids: number[]) {
    return Array.from(
      new Set(
        (ids ?? [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );
  }

  private mapUserRow(row: any): AdminUserListItem {
    return {
      id: Number(row.id ?? 0),
      fullName: String(row.fullName ?? ''),
      email: String(row.email ?? ''),
      phone: row.phone ?? null,
      role: this.normalizeRole(String(row.role ?? UserRole.STUDENT)),
      status: this.mapStatusFromDb(String(row.status ?? 'ACTIVE')),
      avatar: row.avatar ?? null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
      activeEnrollments: Number(row.activeEnrollments ?? 0),
      purchaseCount: Number(row.purchaseCount ?? 0),
      totalSpent: Number(row.totalSpent ?? 0),
    };
  }

  private mapSummary(row: any): AdminUserSummary {
    return {
      totalUsers: Number(row.totalUsers ?? 0),
      activeUsers: Number(row.activeUsers ?? 0),
      inactiveUsers: Number(row.inactiveUsers ?? 0),
      deletedUsers: Number(row.deletedUsers ?? 0),
      admins: Number(row.admins ?? 0),
      instructors: Number(row.instructors ?? 0),
      students: Number(row.students ?? 0),
    };
  }

  private mapStatusFromDb(status: string): AdminUserStatus {
    return API_STATUS_BY_DB_STATUS[status?.trim().toUpperCase()] ?? 'ACTIVE';
  }

  private mapStatusToDb(status: AdminUserStatus) {
    return status;
  }
}
