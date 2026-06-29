import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';
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
  maKH: number | null;
  tenKhoaHoc: string;
  soLuongGioiHan: number | null;
  soLuongDaDung: number;
  ghiChu: string | null;
  maKM: string | null;
  loaiKM: 'FIRST_TIME' | 'CROSS_SELL' | 'HOLIDAY' | 'STANDARD';
};

type CouponScopeType = 'ALL' | 'COURSE' | 'CATEGORY' | 'INSTRUCTOR';

type CouponScopeRow = {
  maPhamVi: number;
  maCoupon: number | string;
  loaiPhamVi: CouponScopeType;
  maDoiTuong: number | null;
  tenDoiTuong: string | null;
};

type CouponRuleType =
  | 'NEW_USER_24H'
  | 'FIRST_PURCHASE'
  | 'COMBO_ONLY'
  | 'MIN_ORDER_VALUE'
  | 'MIN_COURSE_COUNT';

type CouponRuleRow = {
  maDieuKien: number;
  maCoupon: number | string;
  loaiDieuKien: CouponRuleType;
  giaTriDieuKien: number | string | null;
  moTa: string | null;
};

type CouponSummaryRow = {
  totalCouponCount: number | string | null;
  activeCount: number | string | null;
  totalUsageCount: number | string | null;
};

type CouponValidationRow = {
  maCoupon: number | string;
  maCode: string;
  giaTriGiam: number | string;
  loaiGiam: 'PERCENT' | 'AMOUNT';
  trangThai: 'ACTIVE' | 'INACTIVE';
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maKH: number | string | null;
  soLuongGioiHan: number | string | null;
  soLuongDaDung: number | string;
  tenKhoaHoc: string;
  giaBan: number | string;
  maKM: string | null;
  loaiKM: 'FIRST_TIME' | 'CROSS_SELL' | 'HOLIDAY' | 'STANDARD';
};

type CouponUsageUpdateResult = {
  affectedRows?: number;
};

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(KhoaHoc)
    private readonly courseRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

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

  async getAdminCoupons(query: QueryCouponsDto) {
    const normalizedSearch = query.search?.trim() ?? '';
    const normalizedStatus = query.status?.trim().toUpperCase();

    const conditions = ['1 = 1'];
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
          mg.MaKM AS maKM,
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

    const items = await Promise.all(
      rows.map(async (row) => {
        const coupon = this.normalizeCouponRow(row);
        const [rules, scopes] = await Promise.all([
          this.getCouponRules(coupon.maCoupon),
          this.getCouponScopes(coupon.maCoupon),
        ]);

        return {
          ...coupon,
          rules,
          scopes,
        };
      }),
    );

    return {
      summary: {
        totalCouponCount: Number(summary.totalCouponCount ?? 0),
        activeCount: Number(summary.activeCount ?? 0),
        totalUsageCount: Number(summary.totalUsageCount ?? 0),
      },
      items,
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
      maKM: null,
      loaiKM: 'STANDARD',
    });

    const saved = await this.couponRepository.save(coupon);

    return {
      ...saved,
      tenKhoaHoc: course.tenKhoaHoc,
    };
  }

  async createAdminCoupon(adminId: number, payload: {
    maCode: string;
    giaTriGiam: number;
    loaiGiam: 'PERCENT' | 'AMOUNT';
    trangThai?: 'ACTIVE' | 'INACTIVE';
    ngayBatDau?: string | null;
    ngayKetThuc?: string | null;
    soLuongGioiHan?: number | null;
    ghiChu?: string | null;
    maKM?: string | null;
    loaiKM?: 'FIRST_TIME' | 'CROSS_SELL' | 'HOLIDAY' | 'STANDARD';
    scopeType?: CouponScopeType;
    scopeTargetIds?: number[] | null;
    rules?: Array<{
      loaiDieuKien: CouponRuleType;
      giaTriDieuKien?: number | null;
      moTa?: string | null;
    }> | null;
  }) {
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

    const ngayBatDau = this.parseOptionalDate(payload.ngayBatDau);
    const ngayKetThuc = this.parseOptionalDate(payload.ngayKetThuc);
    if (
      ngayBatDau &&
      ngayKetThuc &&
      ngayKetThuc.getTime() <= ngayBatDau.getTime()
    ) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    const soLuongGioiHan =
      payload.soLuongGioiHan === null || payload.soLuongGioiHan === undefined
        ? null
        : Number(payload.soLuongGioiHan);

    if (
      soLuongGioiHan !== null &&
      (!Number.isInteger(soLuongGioiHan) || soLuongGioiHan <= 0)
    ) {
      throw new BadRequestException('Giới hạn lượt dùng phải là số nguyên dương');
    }

    const existing = await this.couponRepository.findOne({ where: { maCode } });
    if (existing) {
      throw new BadRequestException('Mã giảm giá đã tồn tại');
    }

    const scopeType: CouponScopeType = payload.scopeType ?? 'ALL';
    const scopeTargetIds = Array.isArray(payload.scopeTargetIds)
      ? payload.scopeTargetIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (scopeType !== 'ALL' && scopeTargetIds.length === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất một đối tượng áp dụng cho mã giảm giá',
      );
    }

    const rules = Array.isArray(payload.rules)
      ? payload.rules.filter((rule) => !!rule?.loaiDieuKien)
      : [];

    const coupon = this.couponRepository.create({
      maCode,
      giaTriGiam,
      loaiGiam,
      trangThai: payload.trangThai === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      ngayBatDau,
      ngayKetThuc,
      maKH:
        scopeType === 'COURSE' && scopeTargetIds.length === 1
          ? scopeTargetIds[0]
          : null,
      maND_GiangVien: null,
      soLuongGioiHan,
      soLuongDaDung: 0,
      ghiChu: payload.ghiChu?.trim() || null,
      maKM: payload.maKM?.trim() || null,
      loaiKM: payload.loaiKM ?? 'STANDARD',
    });

    const saved = await this.dataSource.transaction(async (manager) => {
      const savedCoupon = await manager.getRepository(Coupon).save(coupon);

      if (scopeType !== 'ALL' || scopeTargetIds.length > 0) {
        const scopeValues = scopeType === 'ALL'
          ? [{ maCoupon: savedCoupon.maCoupon, loaiPhamVi: 'ALL', maDoiTuong: null }]
          : scopeTargetIds.map((targetId) => ({
              maCoupon: savedCoupon.maCoupon,
              loaiPhamVi: scopeType,
              maDoiTuong: targetId,
            }));

        for (const scope of scopeValues) {
          await manager.query(
            `INSERT INTO MaGiamGiaPhamVi (MaCoupon, LoaiPhamVi, MaDoiTuong) VALUES (?, ?, ?)`,
            [scope.maCoupon, scope.loaiPhamVi, scope.maDoiTuong],
          );
        }
      }

      for (const rule of rules) {
        await manager.query(
          `INSERT INTO MaGiamGiaDieuKien (MaCoupon, LoaiDieuKien, GiaTriDieuKien, MoTa) VALUES (?, ?, ?, ?)`,
          [
            savedCoupon.maCoupon,
            rule.loaiDieuKien,
            rule.giaTriDieuKien ?? null,
            rule.moTa?.trim() || null,
          ],
        );
      }

      return savedCoupon;
    });

    return {
      ...saved,
      createdByAdminId: adminId,
      scopeType,
      scopeTargetIds,
      rules,
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

  async updateAdminCouponStatus(
    adminId: number,
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

    coupon.trangThai = trangThai;
    await this.couponRepository.save(coupon);

    return {
      maCoupon: coupon.maCoupon,
      trangThai: coupon.trangThai,
      updatedByAdminId: adminId,
    };
  }

  async validateCoupon(payload: ValidateCouponDto, userId?: number | null) {
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
          kh.TenKhoaHoc AS tenKhoaHoc,
          kh.GiaBan AS giaBan,
          mg.MaKM AS maKM,
          mg.LoaiKM AS loaiKM
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

    const scopeRows = await this.getCouponScopes(coupon.maCoupon);
    const ruleRows = await this.getCouponRules(coupon.maCoupon);

    const placeholders = courseIds.map(() => '?').join(',');
    const cartCourses = (await this.dataSource.query(
      `SELECT MaKH, GiaBan, TenKhoaHoc, MaDM, MaND_GiangVien
       FROM KhoaHoc
       WHERE MaKH IN (${placeholders})`,
      courseIds,
    )) ?? [];

    if (cartCourses.length !== courseIds.length) {
      throw new BadRequestException('Giỏ hàng có khóa học không tồn tại');
    }

    const courseMap = new Map<number, {
      maKH: number;
      giaBan: number;
      tenKhoaHoc: string;
      maDM: number;
      maND_GiangVien: number;
    }>();
    cartCourses.forEach((course: any) => {
      courseMap.set(Number(course.MaKH), {
        maKH: Number(course.MaKH),
        giaBan: Number(course.GiaBan ?? 0),
        tenKhoaHoc: String(course.TenKhoaHoc ?? ''),
        maDM: Number(course.MaDM ?? 0),
        maND_GiangVien: Number(course.MaND_GiangVien ?? 0),
      });
    });

    const targetCourseIds = this.resolveCouponTargetCourseIds(
      scopeRows,
      courseMap,
      coupon,
    );

    if (targetCourseIds.length === 0) {
      throw new BadRequestException(
        'Mã giảm giá không áp dụng cho khóa học trong giỏ hàng',
      );
    }

    await this.ensureCouponRulesPass(ruleRows, {
      userId,
      courseIds,
      totalOriginalPrice: cartCourses.reduce(
        (sum: number, course: any) => sum + Number(course.GiaBan || 0),
        0,
      ),
    });

    const discountedBasePrice = targetCourseIds.reduce((sum, courseId) => {
      const course = courseMap.get(courseId);
      return sum + Number(course?.giaBan ?? 0);
    }, 0);

    const discountAmount = this.calculateDiscountAmount(
      coupon.loaiGiam,
      coupon.giaTriGiam,
      discountedBasePrice,
    );

    const matchedCourseId =
      targetCourseIds.length === 1 ? targetCourseIds[0] : coupon.maKH ?? null;
    const matchedCourseName =
      targetCourseIds.length === 1
        ? courseMap.get(targetCourseIds[0])?.tenKhoaHoc ?? coupon.tenKhoaHoc
        : coupon.tenKhoaHoc || 'Giỏ hàng đủ điều kiện';

    return {
      valid: true,
      couponId: coupon.maCoupon,
      maCode: coupon.maCode,
      matchedCourseId,
      matchedCourseName,
      discountType: coupon.loaiGiam,
      discountValue: coupon.giaTriGiam,
      discountAmount,
      targetCourseIds,
      message:
        targetCourseIds.length === courseIds.length
          ? 'Áp dụng mã giảm giá thành công.'
          : 'Mã giảm giá áp dụng thành công cho các khóa học đủ điều kiện.',
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
      maKM: row.maKM ?? null,
      loaiKM: row.loaiKM ?? 'STANDARD',
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
      maKM: row.maKM ?? null,
      loaiKM: row.loaiKM ?? 'STANDARD',
    };
  }

  private async getCouponRules(couponId: number | string) {
    const rows = (await this.dataSource.query(
      `SELECT
          MaDK AS maDieuKien,
          MaCoupon AS maCoupon,
          LoaiDieuKien AS loaiDieuKien,
          GiaTriDieuKien AS giaTriDieuKien,
          MoTa AS moTa
       FROM MaGiamGiaDieuKien
       WHERE MaCoupon = ?
       ORDER BY MaDK ASC`,
      [couponId],
    )) ?? [];

    return rows.map((row: CouponRuleRow) => ({
      maDieuKien: Number(row.maDieuKien),
      maCoupon: Number(row.maCoupon),
      loaiDieuKien: row.loaiDieuKien,
      giaTriDieuKien:
        row.giaTriDieuKien === null ? null : Number(row.giaTriDieuKien),
      moTa: row.moTa ?? null,
    }));
  }

  private async getCouponScopes(couponId: number | string) {
    const rows = (await this.dataSource.query(
      `SELECT
          MaPV AS maPhamVi,
          MaCoupon AS maCoupon,
          LoaiPhamVi AS loaiPhamVi,
          MaDoiTuong AS maDoiTuong,
          NULL AS tenDoiTuong
       FROM MaGiamGiaPhamVi
       WHERE MaCoupon = ?
       ORDER BY MaPV ASC`,
      [couponId],
    )) ?? [];

    return rows.map((row: CouponScopeRow) => ({
      maPhamVi: Number(row.maPhamVi),
      maCoupon: Number(row.maCoupon),
      loaiPhamVi: row.loaiPhamVi,
      maDoiTuong: row.maDoiTuong === null ? null : Number(row.maDoiTuong),
      tenDoiTuong: row.tenDoiTuong ?? null,
    }));
  }

  private resolveCouponTargetCourseIds(
    scopes: Array<{
      loaiPhamVi: CouponScopeType;
      maDoiTuong: number | null;
    }>,
    courseMap: Map<
      number,
      {
        maKH: number;
        giaBan: number;
        tenKhoaHoc: string;
        maDM: number;
        maND_GiangVien: number;
      }
    >,
    coupon: { maKH: number | null },
  ) {
    if (scopes.length === 0) {
      if (coupon.maKH !== null) {
        return courseMap.has(Number(coupon.maKH))
          ? [Number(coupon.maKH)]
          : [];
      }

      return Array.from(courseMap.keys());
    }

    if (scopes.some((scope) => scope.loaiPhamVi === 'ALL')) {
      return Array.from(courseMap.keys());
    }

    const allowedCourseIds = new Set<number>();
    for (const [courseId, course] of courseMap.entries()) {
      const isAllowed = scopes.some((scope) => {
        if (scope.maDoiTuong === null) {
          return false;
        }

        if (scope.loaiPhamVi === 'COURSE') {
          return Number(scope.maDoiTuong) === courseId;
        }

        if (scope.loaiPhamVi === 'CATEGORY') {
          return Number(scope.maDoiTuong) === Number(course.maDM);
        }

        if (scope.loaiPhamVi === 'INSTRUCTOR') {
          return Number(scope.maDoiTuong) === Number(course.maND_GiangVien);
        }

        return false;
      });

      if (isAllowed) {
        allowedCourseIds.add(courseId);
      }
    }

    return Array.from(allowedCourseIds);
  }

  private async ensureCouponRulesPass(
    rules: Array<{
      loaiDieuKien: CouponRuleType;
      giaTriDieuKien: number | null;
    }>,
    context: {
      userId?: number | null;
      courseIds: number[];
      totalOriginalPrice: number;
    },
  ) {
    if (!rules.length) {
      return;
    }

    const hasRule = (ruleType: CouponRuleType) =>
      rules.some((rule) => rule.loaiDieuKien === ruleType);

    const minOrderValue = rules.find(
      (rule) => rule.loaiDieuKien === 'MIN_ORDER_VALUE',
    );
    const minCourseCount = rules.find(
      (rule) => rule.loaiDieuKien === 'MIN_COURSE_COUNT',
    );
    const comboRule = rules.find(
      (rule) => rule.loaiDieuKien === 'COMBO_ONLY',
    );
    const newUserRule = rules.find(
      (rule) => rule.loaiDieuKien === 'NEW_USER_24H',
    );

    const minComboCourseCount = Math.max(
      2,
      Number(comboRule?.giaTriDieuKien ?? 2) || 2,
    );
    if (comboRule && context.courseIds.length < minComboCourseCount) {
      throw new BadRequestException('Mã giảm giá chỉ áp dụng cho combo nhiều khóa học');
    }

    if (
      minCourseCount &&
      context.courseIds.length < Number(minCourseCount.giaTriDieuKien ?? 0)
    ) {
      throw new BadRequestException('Giỏ hàng chưa đủ số lượng khóa học tối thiểu');
    }

    if (
      minOrderValue &&
      context.totalOriginalPrice < Number(minOrderValue.giaTriDieuKien ?? 0)
    ) {
      throw new BadRequestException('Giỏ hàng chưa đạt giá trị tối thiểu');
    }

    if (newUserRule) {
      if (!context.userId) {
        throw new BadRequestException('Cần đăng nhập để sử dụng mã giảm giá này');
      }

      const userRows = await this.dataSource.query(
        `SELECT NgayTao FROM NguoiDung WHERE MaND = ? LIMIT 1`,
        [context.userId],
      );

      const createdAt = userRows[0]?.NgayTao ? new Date(userRows[0].NgayTao) : null;
      if (!createdAt) {
        throw new BadRequestException('Không tìm thấy thông tin tài khoản');
      }

      const hoursLimit = Number(newUserRule.giaTriDieuKien ?? 24);
      const hoursElapsed =
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > hoursLimit) {
        throw new BadRequestException(
          `Mã chỉ áp dụng cho tài khoản mới trong ${hoursLimit} giờ đầu`,
        );
      }
    }

    if (hasRule('FIRST_PURCHASE')) {
      if (!context.userId) {
        throw new BadRequestException('Cần đăng nhập để sử dụng mã giảm giá này');
      }

      const purchaseRows = await this.dataSource.query(
        `SELECT COUNT(*) AS totalPurchases
         FROM HoaDon
         WHERE MaND = ? AND TrangThaiThanhToan = 'PAID'`,
        [context.userId],
      );

      const totalPurchases = Number(purchaseRows[0]?.totalPurchases ?? 0);
      if (totalPurchases > 0) {
        throw new BadRequestException('Mã chỉ áp dụng cho lượt mua đầu tiên');
      }
    }

    if (hasRule('FIRST_PURCHASE') && !context.userId) {
      throw new BadRequestException('Cần đăng nhập để sử dụng mã giảm giá này');
    }
  }

  async recordCouponRedemption(
    input: {
    couponId: number;
    userId: number;
    invoiceId: number;
    discountAmount: number;
    orderValue: number;
  },
    executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = this.dataSource,
  ) {
    const result = await executor.query(
      `UPDATE MaGiamGia
       SET SoLuongDaDung = SoLuongDaDung + 1
       WHERE MaCoupon = ?
         AND TrangThai = 'ACTIVE'
         AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)`,
      [input.couponId],
    );

    if (!result.affectedRows) {
      throw new BadRequestException(
        'Không thể cập nhật lượt sử dụng cho mã giảm giá này',
      );
    }

    await executor.query(
      `INSERT INTO LichSuSuDungMaGiamGia
        (MaCoupon, MaND, MaHD, GiaTriDonHang, SoTienGiam, ThoiGianSuDung)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        input.couponId,
        input.userId,
        input.invoiceId,
        input.orderValue,
        input.discountAmount,
      ],
    );

    return {
      success: true,
      couponId: input.couponId,
    };
  }
}
