import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';
import {
  type AdminCouponRuleType,
  type AdminCouponScopeType,
} from '../dto/create-admin-coupon.dto';
import { Coupon } from '../entities/coupon.entity';

type CouponRow = {
  maCoupon: number;
  maCode: string;
  giaTriGiam: number | string;
  loaiGiam: 'PERCENT' | 'AMOUNT';
  trangThai: 'ACTIVE' | 'INACTIVE';
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maKH: number;
  tenKhoaHoc: string;
  soLuongGioiHan: number | null;
  soLuongDaDung: number;
  ghiChu: string | null;
};

type CouponValidationRow = {
  maCoupon: number | string;
  maCode: string;
  giaTriGiam: number | string;
  loaiGiam: 'PERCENT' | 'AMOUNT';
  trangThai: 'ACTIVE' | 'INACTIVE';
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maKH: number | string;
  soLuongGioiHan: number | string | null;
  soLuongDaDung: number | string;
  tenKhoaHoc: string;
  giaBan: number | string;
  loaiKM: string | null;
};

type AdminCouponScopeRow = {
  maPV: number | string;
  maCoupon: number | string;
  loaiPhamVi: AdminCouponScopeType;
  maDoiTuong: number | string | null;
};

type AdminCouponRuleRow = {
  maDK: number | string;
  maCoupon: number | string;
  loaiDieuKien: AdminCouponRuleType;
  giaTriDieuKien: number | string | null;
  moTa: string | null;
};

type CouponCourseRow = {
  MaKH: number | string;
  GiaBan: number | string;
  TenKhoaHoc: string;
  MaDM: number | string | null;
  MaND_GiangVien: number | string | null;
};

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    protected readonly couponRepository: Repository<Coupon>,
    @InjectRepository(KhoaHoc)
    protected readonly courseRepository: Repository<KhoaHoc>,
    protected readonly dataSource: DataSource,
  ) {}

  protected parseOptionalDate(value?: string | null) {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Ngày áp dụng mã giảm giá không hợp lệ');
    }

    return parsed;
  }

  protected ensureCouponIsUsable(coupon: {
    trangThai: 'ACTIVE' | 'INACTIVE';
    ngayBatDau: Date | null;
    ngayKetThuc: Date | null;
    soLuongGioiHan: number | null;
    soLuongDaDung: number;
  }) {
    if (coupon.trangThai !== 'ACTIVE') {
      throw new BadRequestException('Mã giảm giá hiện không hoạt động');
    }

    const now = new Date();
    if (coupon.ngayBatDau && coupon.ngayBatDau.getTime() > now.getTime()) {
      throw new BadRequestException('Mã giảm giá chưa đến thời gian sử dụng');
    }

    if (coupon.ngayKetThuc && coupon.ngayKetThuc.getTime() < now.getTime()) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (
      coupon.soLuongGioiHan !== null &&
      coupon.soLuongDaDung >= coupon.soLuongGioiHan
    ) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }
  }

  protected calculateDiscountAmount(
    loaiGiam: 'PERCENT' | 'AMOUNT',
    giaTriGiam: number,
    giaBan: number,
  ) {
    if (loaiGiam === 'PERCENT') {
      return Number(((giaBan * giaTriGiam) / 100).toFixed(2));
    }

    return Number(Math.min(giaTriGiam, giaBan).toFixed(2));
  }

  protected normalizeCouponRow(row: CouponRow) {
    return {
      ...row,
      giaTriGiam: Number(row.giaTriGiam),
      soLuongGioiHan:
        row.soLuongGioiHan === null ? null : Number(row.soLuongGioiHan),
      soLuongDaDung: Number(row.soLuongDaDung),
    };
  }

  protected normalizeCouponValidationRow(row: CouponValidationRow) {
    return {
      maCoupon: Number(row.maCoupon),
      maCode: String(row.maCode),
      giaTriGiam: Number(row.giaTriGiam),
      loaiGiam: row.loaiGiam,
      trangThai: row.trangThai,
      ngayBatDau: row.ngayBatDau ? new Date(row.ngayBatDau) : null,
      ngayKetThuc: row.ngayKetThuc ? new Date(row.ngayKetThuc) : null,
      maKH: row.maKH === null ? null : Number(row.maKH),
      soLuongGioiHan:
        row.soLuongGioiHan === null ? null : Number(row.soLuongGioiHan),
      soLuongDaDung: Number(row.soLuongDaDung ?? 0),
      tenKhoaHoc: String(row.tenKhoaHoc ?? ''),
      giaBan: Number(row.giaBan ?? 0),
      loaiKM: row.loaiKM ? String(row.loaiKM) : null,
    };
  }

  protected normalizeAdminCouponScopeRows(rows: AdminCouponScopeRow[]) {
    return rows.map((row) => ({
      maPV: Number(row.maPV),
      maCoupon: Number(row.maCoupon),
      loaiPhamVi: row.loaiPhamVi,
      maDoiTuong: row.maDoiTuong === null ? null : Number(row.maDoiTuong),
    }));
  }

  protected normalizeAdminCouponRuleRows(rows: AdminCouponRuleRow[]) {
    return rows.map((row) => ({
      maDK: Number(row.maDK),
      maCoupon: Number(row.maCoupon),
      loaiDieuKien: row.loaiDieuKien,
      giaTriDieuKien:
        row.giaTriDieuKien === null ? null : Number(row.giaTriDieuKien),
      moTa: row.moTa,
    }));
  }

  protected async loadAdminCouponScopeRows(couponId: number) {
    const rows = await this.dataSource.query(
      `SELECT
          MaPV AS maPV,
          MaCoupon AS maCoupon,
          LoaiPhamVi AS loaiPhamVi,
          MaDoiTuong AS maDoiTuong
       FROM MaGiamGiaPhamVi
       WHERE MaCoupon = ?
       ORDER BY MaPV ASC`,
      [couponId],
    );

    return this.normalizeAdminCouponScopeRows(rows ?? []);
  }

  protected async loadAdminCouponRuleRows(couponId: number) {
    const rows = await this.dataSource.query(
      `SELECT
          MaDK AS maDK,
          MaCoupon AS maCoupon,
          LoaiDieuKien AS loaiDieuKien,
          GiaTriDieuKien AS giaTriDieuKien,
          MoTa AS moTa
       FROM MaGiamGiaDieuKien
       WHERE MaCoupon = ?
       ORDER BY MaDK ASC`,
      [couponId],
    );

    return this.normalizeAdminCouponRuleRows(rows ?? []);
  }

  protected async loadCouponCourses(courseIds: number[]) {
    if (courseIds.length === 0) {
      return [] as CouponCourseRow[];
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const rows = await this.dataSource.query(
      `SELECT
          MaKH,
          GiaBan,
          TenKhoaHoc,
          MaDM,
          MaND_GiangVien
       FROM KhoaHoc
       WHERE MaKH IN (${placeholders})`,
      courseIds,
    );

    return rows as CouponCourseRow[];
  }

  protected async getCourseSubtotal(courseIds: number[]) {
    if (courseIds.length === 0) {
      return 0;
    }

    const placeholders = courseIds.map(() => '?').join(',');
    const rows = await this.dataSource.query(
      `SELECT SUM(GiaBan) AS TotalPrice FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
      courseIds,
    );
    return rows[0]?.TotalPrice ? Number(rows[0].TotalPrice) : 0;
  }

  protected async getUserCouponContext(userId: number) {
    const [userRows, invoiceRows] = await Promise.all([
      this.dataSource.query(
        `SELECT NgayTao FROM NguoiDung WHERE MaND = ? LIMIT 1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) as count FROM HoaDon WHERE MaND = ? AND TrangThaiThanhToan = 'PAID'`,
        [userId],
      ),
    ]);

    return {
      ngayTao: userRows[0]?.NgayTao ? new Date(userRows[0].NgayTao) : null,
      paidInvoiceCount: Number(invoiceRows[0]?.count ?? 0),
    };
  }

  protected resolveCouponTargetCourseIds(
    scopeRows: Array<{
      loaiPhamVi: AdminCouponScopeType;
      maDoiTuong: number | null;
    }>,
    courseIds: number[],
    courseRows: CouponCourseRow[] = [],
  ) {
    if (scopeRows.some((row) => row.loaiPhamVi === 'ALL')) {
      return [...new Set(courseIds)];
    }

    const targetSet = new Set<number>();
    const courseIdSet = new Set<number>(courseIds);
    const courseRowMap = new Map<number, CouponCourseRow>(
      courseRows.map((row) => [Number(row.MaKH), row]),
    );

    for (const scopeRow of scopeRows) {
      const targetId =
        scopeRow.maDoiTuong === null ? null : Number(scopeRow.maDoiTuong);
      if (!targetId) {
        continue;
      }

      if (scopeRow.loaiPhamVi === 'COURSE') {
        if (courseIdSet.has(targetId)) {
          targetSet.add(targetId);
        }
        continue;
      }

      for (const courseId of courseIds) {
        const course = courseRowMap.get(courseId);
        if (!course) {
          continue;
        }

        if (
          scopeRow.loaiPhamVi === 'CATEGORY' &&
          Number(course.MaDM ?? 0) === targetId
        ) {
          targetSet.add(courseId);
        }

        if (
          scopeRow.loaiPhamVi === 'INSTRUCTOR' &&
          Number(course.MaND_GiangVien ?? 0) === targetId
        ) {
          targetSet.add(courseId);
        }
      }
    }

    return [...targetSet];
  }

  protected ensureCouponRuleSatisfied(
    rule: {
      loaiDieuKien: AdminCouponRuleType;
      giaTriDieuKien: number | null;
    },
    context: {
      userId?: number;
      paidInvoiceCount?: number;
      ngayTao?: Date | null;
      eligibleSubtotal: number;
      eligibleCourseCount: number;
    },
  ) {
    const requiresUserContext = [
      'FIRST_PURCHASE',
      'REPEAT_PURCHASE',
      'NEW_USER_24H',
      'ACCOUNT_AGE_HOURS',
      'NEW_USER_ONLY',
    ].includes(rule.loaiDieuKien);

    if (requiresUserContext && !context.userId) {
      throw new BadRequestException(
        'Mã giảm giá này cần tài khoản đăng nhập để kiểm tra điều kiện',
      );
    }

    switch (rule.loaiDieuKien) {
      case 'FIRST_PURCHASE':
      case 'NEW_USER_ONLY':
        if ((context.paidInvoiceCount ?? 0) > 0) {
          throw new BadRequestException(
            'Mã giảm giá này chỉ dành cho khách hàng mua lần đầu',
          );
        }
        break;
      case 'REPEAT_PURCHASE':
        if ((context.paidInvoiceCount ?? 0) === 0) {
          throw new BadRequestException(
            'Mã giảm giá này chỉ dành cho khách hàng đã mua trước đó',
          );
        }
        break;
      case 'NEW_USER_24H':
        if (context.ngayTao) {
          const ageHours =
            (Date.now() - context.ngayTao.getTime()) / (1000 * 60 * 60);
          if (ageHours > 24) {
            throw new BadRequestException(
              'Mã giảm giá này chỉ dành cho tài khoản mới trong 24 giờ đầu',
            );
          }
        }
        break;
      case 'ACCOUNT_AGE_HOURS': {
        const maxAge = Number(rule.giaTriDieuKien ?? 24);
        if (context.ngayTao) {
          const ageHours =
            (Date.now() - context.ngayTao.getTime()) / (1000 * 60 * 60);
          if (ageHours > maxAge) {
            throw new BadRequestException(
              'Tài khoản không thỏa điều kiện thời gian tạo',
            );
          }
        }
        break;
      }
      case 'COMBO_ONLY': {
        const minCombo = Number(rule.giaTriDieuKien ?? 2);
        if (context.eligibleCourseCount < minCombo) {
          throw new BadRequestException(
            'Mã giảm giá này chỉ áp dụng khi mua combo đủ số lượng khóa học yêu cầu',
          );
        }
        break;
      }
      case 'MIN_ORDER_VALUE': {
        const minOrderValue = Number(rule.giaTriDieuKien ?? 0);
        if (context.eligibleSubtotal < minOrderValue) {
          throw new BadRequestException(
            'Giá trị đơn hàng chưa đạt mức tối thiểu để áp dụng mã giảm giá',
          );
        }
        break;
      }
      case 'MIN_COURSE_COUNT': {
        const minCourseCount = Number(rule.giaTriDieuKien ?? 1);
        if (context.eligibleCourseCount < minCourseCount) {
          throw new BadRequestException(
            'Số lượng khóa học trong giỏ chưa đạt mức tối thiểu để áp dụng mã giảm giá',
          );
        }
        break;
      }
      default:
        break;
    }
  }
}
