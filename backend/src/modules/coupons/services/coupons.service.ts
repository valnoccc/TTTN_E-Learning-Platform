import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';
import {
  CreateAdminCouponDto,
  type AdminCouponRuleInput,
  type AdminCouponRuleType,
  type AdminCouponScopeType,
} from '../dto/create-admin-coupon.dto';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { QueryCouponsDto } from '../dto/query-coupons.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
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
  targetCourseIds?: number[];
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
export class CouponsService implements OnModuleInit {
  private adminCouponSchemaReady: Promise<void> | null = null;

  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(KhoaHoc)
    private readonly courseRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureAdminCouponSchema();
  }

  private ensureAdminCouponSchema() {
    if (!this.adminCouponSchemaReady) {
      this.adminCouponSchemaReady = (async () => {
        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGia\`
           ADD COLUMN IF NOT EXISTS \`MaKM\` varchar(100) DEFAULT NULL AFTER \`GhiChu\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGia\`
           ADD COLUMN IF NOT EXISTS \`LoaiKM\` enum('FIRST_TIME','CROSS_SELL','HOLIDAY','STANDARD') DEFAULT 'STANDARD' AFTER \`MaKM\``,
        );

        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`MaGiamGiaDieuKien\` (
            \`MaDK\` int NOT NULL AUTO_INCREMENT,
            \`MaCoupon\` int NOT NULL,
            \`LoaiDieuKien\` enum(
              'NEW_USER_24H',
              'FIRST_PURCHASE',
              'COMBO_ONLY',
              'MIN_ORDER_VALUE',
              'MIN_COURSE_COUNT'
            ) NOT NULL,
            \`GiaTriDieuKien\` decimal(12,2) DEFAULT NULL,
            \`MoTa\` varchar(255) DEFAULT NULL,
            \`NgayTao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`MaDK\`),
            KEY \`idx_coupon_rule_coupon\` (\`MaCoupon\`),
            KEY \`idx_coupon_rule_type\` (\`LoaiDieuKien\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaDieuKien\`
           MODIFY COLUMN \`LoaiDieuKien\` enum(
             'NEW_USER_24H',
             'FIRST_PURCHASE',
             'COMBO_ONLY',
             'MIN_ORDER_VALUE',
             'MIN_COURSE_COUNT',
             'ACCOUNT_AGE_HOURS',
             'REPEAT_PURCHASE',
             'NEW_USER_ONLY'
           ) NOT NULL`,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaDieuKien\`
           ADD COLUMN IF NOT EXISTS \`GiaTriDieuKien\` decimal(12,2) DEFAULT NULL AFTER \`LoaiDieuKien\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaDieuKien\`
           ADD COLUMN IF NOT EXISTS \`MoTa\` varchar(255) DEFAULT NULL AFTER \`GiaTriDieuKien\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaDieuKien\`
           ADD COLUMN IF NOT EXISTS \`NgayTao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER \`MoTa\``,
        );

        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`MaGiamGiaPhamVi\` (
            \`MaPV\` int NOT NULL AUTO_INCREMENT,
            \`MaCoupon\` int NOT NULL,
            \`LoaiPhamVi\` enum('ALL','COURSE','CATEGORY','INSTRUCTOR') NOT NULL,
            \`MaDoiTuong\` int DEFAULT NULL,
            \`NgayTao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`MaPV\`),
            KEY \`idx_coupon_scope_coupon\` (\`MaCoupon\`),
            KEY \`idx_coupon_scope_type\` (\`LoaiPhamVi\`),
            KEY \`idx_coupon_scope_target\` (\`MaDoiTuong\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaPhamVi\`
           ADD COLUMN IF NOT EXISTS \`LoaiPhamVi\` enum('ALL','COURSE','CATEGORY','INSTRUCTOR') NOT NULL AFTER \`MaCoupon\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaPhamVi\`
           ADD COLUMN IF NOT EXISTS \`MaDoiTuong\` int DEFAULT NULL AFTER \`LoaiPhamVi\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaPhamVi\`
           ADD COLUMN IF NOT EXISTS \`NgayTao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER \`MaDoiTuong\``,
        );

        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`LichSuSuDungMaGiamGia\` (
            \`MaLSSD\` int NOT NULL AUTO_INCREMENT,
            \`MaCoupon\` int NOT NULL,
            \`MaND\` int NOT NULL,
            \`MaHD\` int NOT NULL,
            \`GiaTriDonHang\` decimal(12,2) NOT NULL DEFAULT '0.00',
            \`SoTienGiam\` decimal(12,2) NOT NULL DEFAULT '0.00',
            \`ThoiGianSuDung\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`MaLSSD\`),
            UNIQUE KEY \`uq_coupon_invoice\` (\`MaCoupon\`, \`MaHD\`),
            KEY \`idx_coupon_redemption_user\` (\`MaND\`),
            KEY \`idx_coupon_redemption_invoice\` (\`MaHD\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        );

        await this.dataSource.query(
          `ALTER TABLE \`LichSuSuDungMaGiamGia\`
           ADD COLUMN IF NOT EXISTS \`GiaTriDonHang\` decimal(12,2) NOT NULL DEFAULT '0.00' AFTER \`MaHD\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`LichSuSuDungMaGiamGia\`
           ADD COLUMN IF NOT EXISTS \`SoTienGiam\` decimal(12,2) NOT NULL DEFAULT '0.00' AFTER \`GiaTriDonHang\``,
        );

        await this.dataSource.query(
          `ALTER TABLE \`LichSuSuDungMaGiamGia\`
           ADD COLUMN IF NOT EXISTS \`ThoiGianSuDung\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER \`SoTienGiam\``,
        );
      })();
    }

    return this.adminCouponSchemaReady;
  }

  async getInstructorCoupons(instructorId: number, query: QueryCouponsDto) {
    const normalizedSearch = query.search?.trim() ?? '';
    const normalizedStatus = query.status?.trim().toUpperCase();

    const conditions = ['mg.MaND_GiangVien = ?'];
    const params: Array<string | number> = [instructorId];

    if (normalizedSearch) {
      conditions.push('mg.MaCode LIKE ?');
      params.push(`%${normalizedSearch}%`);
    }

    if (normalizedStatus && ['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      conditions.push('mg.TrangThai = ?');
      params.push(normalizedStatus);
    }

    const rows = await this.dataSource.query(
      `SELECT
          mg.MaCoupon AS maCoupon,
          mg.MaCode AS maCode,
          mg.GiaTriGiam AS giaTriGiam,
          mg.LoaiGiam AS loaiGiam,
          mg.TrangThai AS trangThai,
          mg.NgayBatDau AS ngayBatDau,
          mg.NgayKetThuc AS ngayKetThuc,
          mg.MaKH AS maKH,
          kh.TenKhoaHoc AS tenKhoaHoc,
          mg.SoLuongGioiHan AS soLuongGioiHan,
          mg.SoLuongDaDung AS soLuongDaDung,
          mg.GhiChu AS ghiChu
       FROM MaGiamGia mg
       INNER JOIN KhoaHoc kh ON kh.MaKH = mg.MaKH
       WHERE ${conditions.join(' AND ')}
       ORDER BY mg.MaCoupon DESC`,
      params,
    );

    const summaryResult = await this.dataSource.query(
      `SELECT
          COUNT(*) AS totalCouponCount,
          SUM(CASE WHEN TrangThai = 'ACTIVE' THEN 1 ELSE 0 END) AS activeCount,
          COALESCE(SUM(SoLuongDaDung), 0) AS totalUsageCount
       FROM MaGiamGia
       WHERE MaND_GiangVien = ?`,
      [instructorId],
    );

    const summary = summaryResult[0] ?? {
      totalCouponCount: 0,
      activeCount: 0,
      totalUsageCount: 0,
    };

    return {
      summary: {
        totalCouponCount: Number(summary.totalCouponCount ?? 0),
        activeCount: Number(summary.activeCount ?? 0),
        totalUsageCount: Number(summary.totalUsageCount ?? 0),
      },
      items: rows.map((row) => this.normalizeCouponRow(row)),
    };
  }

  async createCoupon(instructorId: number, payload: CreateCouponDto) {
    const maCode = payload.maCode?.trim().toUpperCase();
    if (!maCode) {
      throw new BadRequestException('Mã giảm giá không được để trống');
    }

    const loaiGiam = payload.loaiGiam;
    if (!['PERCENT', 'AMOUNT'].includes(loaiGiam)) {
      throw new BadRequestException('Loại giảm giá không hợp lệ');
    }

    const giaTriGiam = Number(payload.giaTriGiam);
    if (!Number.isFinite(giaTriGiam) || giaTriGiam <= 0) {
      throw new BadRequestException('Giá trị giảm phải lớn hơn 0');
    }

    if (loaiGiam === 'PERCENT' && (giaTriGiam < 1 || giaTriGiam > 99)) {
      throw new BadRequestException('Mã phần trăm chỉ được phép từ 1 đến 99');
    }

    const maKH = Number(payload.maKH);
    if (!Number.isInteger(maKH) || maKH <= 0) {
      throw new BadRequestException('Khóa học áp dụng không hợp lệ');
    }

    const soLuongGioiHan =
      payload.soLuongGioiHan === null || payload.soLuongGioiHan === undefined
        ? null
        : Number(payload.soLuongGioiHan);

    if (
      soLuongGioiHan !== null &&
      (!Number.isInteger(soLuongGioiHan) || soLuongGioiHan <= 0)
    ) {
      throw new BadRequestException(
        'Giới hạn lượt dùng phải là số nguyên dương',
      );
    }

    const ngayBatDau = this.parseOptionalDate(payload.ngayBatDau);
    const ngayKetThuc = this.parseOptionalDate(payload.ngayKetThuc);

    if (
      ngayBatDau &&
      ngayKetThuc &&
      ngayKetThuc.getTime() <= ngayBatDau.getTime()
    ) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    const existing = await this.couponRepository.findOne({ where: { maCode } });
    if (existing) {
      throw new BadRequestException('Mã giảm giá đã tồn tại');
    }

    const course = await this.courseRepository.findOne({
      where: { maKH, maND_GiangVien: instructorId },
    });
    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo mã cho khóa học này',
      );
    }

    const coupon = this.couponRepository.create({
      maCode,
      giaTriGiam,
      loaiGiam,
      trangThai: payload.trangThai === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      ngayBatDau,
      ngayKetThuc,
      maKH,
      maND_GiangVien: instructorId,
      soLuongGioiHan,
      soLuongDaDung: 0,
      ghiChu: payload.ghiChu?.trim() || null,
    });

    const saved = await this.couponRepository.save(coupon);

    return {
      ...saved,
      tenKhoaHoc: course.tenKhoaHoc,
    };
  }

  async updateCouponStatus(
    instructorId: number,
    couponId: number,
    trangThai: 'ACTIVE' | 'INACTIVE',
  ) {
    if (!['ACTIVE', 'INACTIVE'].includes(trangThai)) {
      throw new BadRequestException('Trạng thái mã giảm giá không hợp lệ');
    }

    const coupon = await this.couponRepository.findOne({
      where: { maCoupon: couponId },
    });
    if (!coupon) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    if (coupon.maND_GiangVien !== instructorId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật mã giảm giá này',
      );
    }

    coupon.trangThai = trangThai;
    await this.couponRepository.save(coupon);

    return {
      maCoupon: coupon.maCoupon,
      trangThai: coupon.trangThai,
    };
  }

  async validateCoupon(payload: ValidateCouponDto, userId?: number) {
    const maCode = payload.maCode?.trim().toUpperCase();
    if (!maCode) {
      throw new BadRequestException('Vui lòng nhập mã giảm giá');
    }

    const courseIds = Array.isArray(payload.courseIds)
      ? payload.courseIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (courseIds.length === 0) {
      throw new BadRequestException(
        'Giỏ hàng không hợp lệ để áp dụng mã giảm giá',
      );
    }

    const rows = await this.dataSource.query(
      `SELECT
          mg.MaCoupon AS maCoupon,
          mg.MaCode AS maCode,
          mg.GiaTriGiam AS giaTriGiam,
          mg.LoaiGiam AS loaiGiam,
          mg.TrangThai AS trangThai,
          mg.NgayBatDau AS ngayBatDau,
          mg.NgayKetThuc AS ngayKetThuc,
          mg.MaKH AS maKH,
          mg.SoLuongGioiHan AS soLuongGioiHan,
          mg.SoLuongDaDung AS soLuongDaDung,
          mg.LoaiKM AS loaiKM,
          kh.TenKhoaHoc AS tenKhoaHoc,
          kh.GiaBan AS giaBan
       FROM MaGiamGia mg
       LEFT JOIN KhoaHoc kh ON kh.MaKH = mg.MaKH
       WHERE mg.MaCode = ?
       LIMIT 1`,
      [maCode],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }

    const coupon = this.normalizeCouponValidationRow(rows[0]);
    this.ensureCouponIsUsable(coupon);

    const scopeRows = await this.loadAdminCouponScopeRows(coupon.maCoupon);
    const ruleRows = await this.loadAdminCouponRuleRows(coupon.maCoupon);
    const effectiveScopeRows =
      scopeRows.length > 0
        ? scopeRows
        : coupon.maKH !== null
          ? [{ loaiPhamVi: 'COURSE' as const, maDoiTuong: coupon.maKH }]
          : [{ loaiPhamVi: 'ALL' as const, maDoiTuong: null }];

    let targetCourseIds: number[] = [];
    let courseRows: CouponCourseRow[] = [];

    if (
      effectiveScopeRows.some(
        (row) =>
          row.loaiPhamVi === 'CATEGORY' || row.loaiPhamVi === 'INSTRUCTOR',
      )
    ) {
      courseRows = await this.loadCouponCourses(courseIds);
    }

    targetCourseIds = this.resolveCouponTargetCourseIds(
      effectiveScopeRows,
      courseIds,
      courseRows,
    );

    if (targetCourseIds.length === 0) {
      throw new BadRequestException(
        'Mã giảm giá không áp dụng cho khóa học trong giỏ hàng',
      );
    }

    if (coupon.loaiKM === 'FIRST_TIME' && userId) {
      const paidInvoices = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM HoaDon WHERE MaND = ? AND TrangThaiThanhToan = 'PAID'`,
        [userId],
      );
      if (Number(paidInvoices[0]?.count || 0) > 0) {
        throw new BadRequestException(
          'Mã giảm giá này chỉ dành cho khách hàng mua khóa học lần đầu tiên.',
        );
      }
    }

    let applicablePrice = 0;
    if (coupon.loaiKM === 'CROSS_SELL' && userId) {
      const lastInvoices = await this.dataSource.query(
        `SELECT MaHD FROM HoaDon
           WHERE MaND = ? AND TrangThaiThanhToan = 'PAID' AND COALESCE(NgayThanhToan, NgayLap) >= NOW() - INTERVAL 30 MINUTE
           ORDER BY NgayThanhToan DESC LIMIT 1`,
        [userId],
      );

      let validCrossSellCourseIds: number[] = [];

      if (lastInvoices.length > 0) {
        const invoiceId = lastInvoices[0].MaHD;
        const details = await this.dataSource.query(
          `SELECT cthd.MaKH, k.MaDM FROM ChiTietHoaDon cthd JOIN KhoaHoc k ON k.MaKH = cthd.MaKH WHERE cthd.MaHD = ? LIMIT 1`,
          [invoiceId],
        );
        if (details.length > 0) {
          const oldCourseId = details[0].MaKH;
          const maDM = details[0].MaDM || 0;
          let excludeCondition = `k.MaKH != ?`;
          const params: any[] = [oldCourseId];

          excludeCondition += ` AND k.MaKH NOT IN (SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND TrangThai = 'ACTIVE')`;
          params.push(userId);

          const recommendations = await this.dataSource.query(
            `SELECT k.MaKH as maKH
               FROM KhoaHoc k
               WHERE ${excludeCondition} AND k.TrangThai = 'PUBLISHED'
               ORDER BY (k.MaDM = ?) DESC, k.MaKH DESC LIMIT 4`,
            [...params, maDM],
          );
          validCrossSellCourseIds = recommendations.map((r: any) =>
            Number(r.maKH),
          );
        }
      }

      const validCartCourseIds = targetCourseIds.filter((id) =>
        validCrossSellCourseIds.includes(Number(id)),
      );
      if (validCartCourseIds.length === 0) {
        throw new BadRequestException(
          'Mã giảm giá CROSS_SELL không áp dụng cho bất kỳ khóa học nào trong giỏ hàng (Khóa học không nằm trong danh sách gợi ý hợp lệ hoặc ưu đãi đã hết hạn).',
        );
      }

      targetCourseIds = validCartCourseIds;
      applicablePrice = await this.getCourseSubtotal(validCartCourseIds);
    } else {
      applicablePrice = await this.getCourseSubtotal(targetCourseIds);
    }

    const requiresUserContext = ruleRows.some((rule) =>
      [
        'FIRST_PURCHASE',
        'REPEAT_PURCHASE',
        'NEW_USER_24H',
        'ACCOUNT_AGE_HOURS',
        'NEW_USER_ONLY',
      ].includes(rule.loaiDieuKien),
    );
    const userContext =
      requiresUserContext && userId
        ? await this.getUserCouponContext(userId)
        : null;

    for (const rule of ruleRows) {
      this.ensureCouponRuleSatisfied(rule, {
        userId,
        paidInvoiceCount: userContext?.paidInvoiceCount,
        ngayTao: userContext?.ngayTao,
        eligibleSubtotal: applicablePrice,
        eligibleCourseCount: targetCourseIds.length,
      });
    }

    const discountAmount = this.calculateDiscountAmount(
      coupon.loaiGiam,
      coupon.giaTriGiam,
      applicablePrice,
    );

    return {
      valid: true,
      couponId: coupon.maCoupon,
      maCode: coupon.maCode,
      matchedCourseId: targetCourseIds[0] ?? coupon.maKH,
      matchedCourseName: coupon.tenKhoaHoc,
      discountType: coupon.loaiGiam,
      discountValue: coupon.giaTriGiam,
      discountAmount,
      targetCourseIds,
      message:
        targetCourseIds.length === courseIds.length
          ? 'Áp dụng mã giảm giá toàn sàn thành công.'
          : coupon.tenKhoaHoc
            ? `Áp dụng mã giảm giá cho khóa học ${coupon.tenKhoaHoc} thành công.`
            : 'Áp dụng mã giảm giá thành công.',
    };
  }

  async consumeCouponUsage(couponId: number) {
    const result = await this.dataSource.query(
      `UPDATE MaGiamGia
       SET SoLuongDaDung = SoLuongDaDung + 1
       WHERE MaCoupon = ?
         AND TrangThai = 'ACTIVE'
         AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)`,
      [couponId],
    );

    if (!result.affectedRows) {
      throw new BadRequestException(
        'Không thể cập nhật lượt sử dụng cho mã giảm giá này',
      );
    }

    return {
      success: true,
      couponId,
    };
  }

  private parseOptionalDate(value?: string | null) {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Ngày áp dụng mã giảm giá không hợp lệ');
    }

    return parsed;
  }

  private ensureCouponIsUsable(coupon: {
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

  private calculateDiscountAmount(
    loaiGiam: 'PERCENT' | 'AMOUNT',
    giaTriGiam: number,
    giaBan: number,
  ) {
    if (loaiGiam === 'PERCENT') {
      return Number(((giaBan * giaTriGiam) / 100).toFixed(2));
    }

    return Number(Math.min(giaTriGiam, giaBan).toFixed(2));
  }

  private normalizeCouponRow(row: CouponRow) {
    return {
      ...row,
      giaTriGiam: Number(row.giaTriGiam),
      soLuongGioiHan:
        row.soLuongGioiHan === null ? null : Number(row.soLuongGioiHan),
      soLuongDaDung: Number(row.soLuongDaDung),
    };
  }

  private normalizeCouponValidationRow(row: CouponValidationRow) {
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

  private normalizeAdminCouponScopeRows(rows: AdminCouponScopeRow[]) {
    return rows.map((row) => ({
      maPV: Number(row.maPV),
      maCoupon: Number(row.maCoupon),
      loaiPhamVi: row.loaiPhamVi,
      maDoiTuong: row.maDoiTuong === null ? null : Number(row.maDoiTuong),
    }));
  }

  private normalizeAdminCouponRuleRows(rows: AdminCouponRuleRow[]) {
    return rows.map((row) => ({
      maDK: Number(row.maDK),
      maCoupon: Number(row.maCoupon),
      loaiDieuKien: row.loaiDieuKien,
      giaTriDieuKien:
        row.giaTriDieuKien === null ? null : Number(row.giaTriDieuKien),
      moTa: row.moTa,
    }));
  }

  private async loadAdminCouponScopeRows(couponId: number) {
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

  private async loadAdminCouponRuleRows(couponId: number) {
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

  private async loadCouponCourses(courseIds: number[]) {
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

  private async getCourseSubtotal(courseIds: number[]) {
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

  private async getUserCouponContext(userId: number) {
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

  private resolveCouponTargetCourseIds(
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

  private ensureCouponRuleSatisfied(
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

  async recordCouponRedemption(
    payload: {
      couponId: number;
      userId: number;
      invoiceId: number;
      discountAmount: number;
      orderValue: number;
    },
    queryRunner?: any,
  ) {
    const runner = queryRunner || this.dataSource;
    await runner.query(
      `UPDATE MaGiamGia
       SET SoLuongDaDung = SoLuongDaDung + 1
       WHERE MaCoupon = ?`,
      [payload.couponId],
    );

    await runner.query(
      `INSERT INTO LichSuSuDungMaGiamGia (
          MaCoupon,
          MaND,
          MaHD,
          GiaTriDonHang,
          SoTienGiam
       ) VALUES (?, ?, ?, ?, ?)`,
      [
        payload.couponId,
        payload.userId,
        payload.invoiceId,
        payload.orderValue,
        payload.discountAmount,
      ],
    );
  }

  async getAdminCoupons(query: QueryCouponsDto) {
    const normalizedSearch = query.search?.trim() ?? '';
    const normalizedStatus = query.status?.trim().toUpperCase();

    const conditions = ['1=1'];
    const params: Array<string | number> = [];

    if (normalizedSearch) {
      conditions.push('mg.MaCode LIKE ?');
      params.push(`%${normalizedSearch}%`);
    }

    if (normalizedStatus && ['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      conditions.push('mg.TrangThai = ?');
      params.push(normalizedStatus);
    }

    const rows = await this.dataSource.query(
      `SELECT
          mg.MaCoupon AS maCoupon,
          mg.MaCode AS maCode,
          mg.GiaTriGiam AS giaTriGiam,
          mg.LoaiGiam AS loaiGiam,
          mg.TrangThai AS trangThai,
          mg.NgayBatDau AS ngayBatDau,
          mg.NgayKetThuc AS ngayKetThuc,
          mg.MaKH AS maKH,
          kh.TenKhoaHoc AS tenKhoaHoc,
          mg.SoLuongGioiHan AS soLuongGioiHan,
          mg.SoLuongDaDung AS soLuongDaDung,
          mg.GhiChu AS ghiChu,
          mg.LoaiKM AS loaiKM
       FROM MaGiamGia mg
       LEFT JOIN KhoaHoc kh ON kh.MaKH = mg.MaKH
       WHERE ${conditions.join(' AND ')}
       ORDER BY mg.MaCoupon DESC`,
      params,
    );

    const summaryResult = await this.dataSource.query(
      `SELECT
          COUNT(*) AS totalCouponCount,
          SUM(CASE WHEN TrangThai = 'ACTIVE' THEN 1 ELSE 0 END) AS activeCount,
          COALESCE(SUM(SoLuongDaDung), 0) AS totalUsageCount
       FROM MaGiamGia`,
    );

    const summary = summaryResult[0] ?? {
      totalCouponCount: 0,
      activeCount: 0,
      totalUsageCount: 0,
    };

    return {
      summary: {
        totalCouponCount: Number(summary.totalCouponCount ?? 0),
        activeCount: Number(summary.activeCount ?? 0),
        totalUsageCount: Number(summary.totalUsageCount ?? 0),
      },
      items: rows.map((row) => this.normalizeCouponRow(row)),
    };
  }

  async createAdminCoupon(adminId: number, payload: CreateAdminCouponDto) {
    const maCode = payload.maCode?.trim().toUpperCase();
    if (!maCode) {
      throw new BadRequestException('Mã giảm giá không được để trống');
    }
    const loaiGiam = payload.loaiGiam;
    const giaTriGiam = Number(payload.giaTriGiam);

    if (!['PERCENT', 'AMOUNT'].includes(loaiGiam)) {
      throw new BadRequestException('Loại giảm giá không hợp lệ');
    }

    if (!Number.isFinite(giaTriGiam) || giaTriGiam <= 0) {
      throw new BadRequestException('Giá trị giảm phải lớn hơn 0');
    }

    if (loaiGiam === 'PERCENT' && (giaTriGiam < 1 || giaTriGiam > 99)) {
      throw new BadRequestException('Mã phần trăm chỉ được phép từ 1 đến 99');
    }

    const soLuongGioiHan =
      payload.soLuongGioiHan === null || payload.soLuongGioiHan === undefined
        ? null
        : Number(payload.soLuongGioiHan);

    if (
      soLuongGioiHan !== null &&
      (!Number.isInteger(soLuongGioiHan) || soLuongGioiHan <= 0)
    ) {
      throw new BadRequestException(
        'Giới hạn lượt dùng phải là số nguyên dương',
      );
    }

    const normalizedScopeType: AdminCouponScopeType =
      payload.scopeType ?? (payload.scopeTargetIds?.length ? 'COURSE' : 'ALL');

    const scopeTargetIds = Array.isArray(payload.scopeTargetIds)
      ? [
          ...new Set(
            payload.scopeTargetIds
              .map((id) => Number(id))
              .filter((id) => Number.isInteger(id) && id > 0),
          ),
        ]
      : [];

    if (normalizedScopeType !== 'ALL' && scopeTargetIds.length === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất một đối tượng áp dụng cho phạm vi này',
      );
    }

    const normalizedRules: Array<{
      loaiDieuKien: AdminCouponRuleType;
      giaTriDieuKien: number | null;
      moTa: string | null;
    }> = Array.isArray(payload.rules)
      ? payload.rules.map((rule: AdminCouponRuleInput) => {
          const ruleValue =
            rule.giaTriDieuKien === null || rule.giaTriDieuKien === undefined
              ? null
              : Number(rule.giaTriDieuKien);
          if (
            ruleValue !== null &&
            (!Number.isFinite(ruleValue) || ruleValue < 0)
          ) {
            throw new BadRequestException('Giá trị điều kiện không hợp lệ');
          }
          return {
            loaiDieuKien: rule.loaiDieuKien,
            giaTriDieuKien: ruleValue,
            moTa: rule.moTa?.trim() || null,
          };
        })
      : [];

    const ruleTypesNeedValue: AdminCouponRuleType[] = [
      'COMBO_ONLY',
      'MIN_ORDER_VALUE',
      'MIN_COURSE_COUNT',
      'ACCOUNT_AGE_HOURS',
    ];

    for (const rule of normalizedRules) {
      if (
        ruleTypesNeedValue.includes(rule.loaiDieuKien) &&
        rule.giaTriDieuKien === null
      ) {
        throw new BadRequestException('Điều kiện này cần nhập giá trị áp dụng');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const maKH =
        normalizedScopeType === 'COURSE' && scopeTargetIds.length === 1
          ? scopeTargetIds[0]
          : null;
      const insertResult = await queryRunner.query(
        `INSERT INTO MaGiamGia (
          MaCode, GiaTriGiam, LoaiGiam, TrangThai, NgayBatDau, NgayKetThuc,
          MaKH, SoLuongGioiHan, SoLuongDaDung, MaND_GiangVien, GhiChu, MaKM, LoaiKM
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?)`,
        [
          maCode,
          giaTriGiam,
          loaiGiam,
          payload.trangThai || 'ACTIVE',
          payload.ngayBatDau ? new Date(payload.ngayBatDau) : null,
          payload.ngayKetThuc ? new Date(payload.ngayKetThuc) : null,
          maKH,
          soLuongGioiHan,
          payload.ghiChu || null,
          payload.maKM || null,
          payload.loaiKM || null,
        ],
      );
      const couponId = insertResult.insertId;

      const scopeRows =
        normalizedScopeType === 'ALL'
          ? [{ loaiPhamVi: 'ALL' as const, maDoiTuong: null }]
          : scopeTargetIds.map((targetId) => ({
              loaiPhamVi: normalizedScopeType,
              maDoiTuong: targetId,
            }));

      for (const scopeRow of scopeRows) {
        await queryRunner.query(
          `INSERT INTO MaGiamGiaPhamVi (MaCoupon, LoaiPhamVi, MaDoiTuong) VALUES (?, ?, ?)`,
          [couponId, scopeRow.loaiPhamVi, scopeRow.maDoiTuong],
        );
      }

      for (const rule of normalizedRules) {
        await queryRunner.query(
          `INSERT INTO MaGiamGiaDieuKien (MaCoupon, LoaiDieuKien, GiaTriDieuKien, MoTa) VALUES (?, ?, ?, ?)`,
          [couponId, rule.loaiDieuKien, rule.giaTriDieuKien, rule.moTa],
        );
      }

      await queryRunner.commitTransaction();
      return { couponId, maCode };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Mã giảm giá đã tồn tại');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAdminCouponStatus(
    adminId: number,
    couponId: number,
    status: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE MaGiamGia SET TrangThai = ? WHERE MaCoupon = ?`,
      [status, couponId],
    );
    if (!result.affectedRows) {
      throw new BadRequestException('Mã giảm giá không tồn tại');
    }
    return { couponId, status };
  }
}
