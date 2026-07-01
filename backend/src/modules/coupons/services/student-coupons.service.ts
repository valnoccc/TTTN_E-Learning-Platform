import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { Coupon } from '../entities/coupon.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';
import { CouponsService } from './coupons.service';

@Injectable()
export class StudentCouponsService extends CouponsService {
  constructor(
    @InjectRepository(Coupon)
    couponRepository: any,
    @InjectRepository(KhoaHoc)
    courseRepository: any,
    dataSource: DataSource,
  ) {
    super(couponRepository, courseRepository, dataSource);
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
    let courseRows: any[] = [];

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
      const validCrossSellCourseIds = await this.getValidCrossSellCourseIds(
        userId,
      );

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

  private async getValidCrossSellCourseIds(userId: number) {
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

    return validCrossSellCourseIds;
  }
}
