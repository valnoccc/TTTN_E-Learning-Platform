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
  maKH: number;
  tenKhoaHoc: string;
  soLuongGioiHan: number | null;
  soLuongDaDung: number;
  ghiChu: string | null;
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
  maKH: number | string;
  soLuongGioiHan: number | string | null;
  soLuongDaDung: number | string;
  tenKhoaHoc: string;
  giaBan: number | string;
  loaiKM: string | null;
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

    if (coupon.maKH !== null && !courseIds.includes(coupon.maKH)) {
      throw new BadRequestException(
        'Mã giảm giá không áp dụng cho khóa học trong giỏ hàng',
      );
    }

    if (coupon.loaiKM === 'FIRST_TIME' && userId) {
      const paidInvoices = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM HoaDon WHERE MaND = ? AND TrangThaiThanhToan = 'PAID'`,
        [userId]
      );
      if (Number(paidInvoices[0]?.count || 0) > 0) {
        throw new BadRequestException('Mã giảm giá này chỉ dành cho khách hàng mua khóa học lần đầu tiên.');
      }
    }

    let applicablePrice = coupon.giaBan;
    if (coupon.maKH === null) {
      // Global coupon applies to the total price of the cart
      if (coupon.loaiKM === 'CROSS_SELL' && userId) {
        // Double check cross-sell
        const lastInvoices = await this.dataSource.query(
          `SELECT MaHD FROM HoaDon 
           WHERE MaND = ? AND TrangThaiThanhToan = 'PAID' AND NgayLap >= NOW() - INTERVAL 30 MINUTE
           ORDER BY NgayLap DESC LIMIT 1`,
          [userId]
        );
        
        let validCrossSellCourseIds: number[] = [];
        
        if (lastInvoices.length > 0) {
          const invoiceId = lastInvoices[0].MaHD;
          const details = await this.dataSource.query(
            `SELECT MaKH FROM ChiTietHoaDon WHERE MaHD = ? LIMIT 1`,
            [invoiceId]
          );
          if (details.length > 0) {
            const oldCourseId = details[0].MaKH;
            let excludeCondition = `k.MaKH != ?`;
            let params: any[] = [oldCourseId];
            
            excludeCondition += ` AND k.MaKH NOT IN (SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND TrangThai = 'ACTIVE')`;
            params.push(userId);
            
            const recommendations = await this.dataSource.query(
              `SELECT k.MaKH as maKH
               FROM KhoaHoc k
               WHERE ${excludeCondition} AND k.TrangThai = 'PUBLISHED' 
               ORDER BY k.MaKH DESC LIMIT 4`,
              params
            );
            validCrossSellCourseIds = recommendations.map((r: any) => Number(r.maKH));
          }
        }
        
        const validCartCourseIds = courseIds.filter(id => validCrossSellCourseIds.includes(Number(id)));
        if (validCartCourseIds.length === 0) {
          throw new BadRequestException('Mã giảm giá CROSS_SELL không áp dụng cho bất kỳ khóa học nào trong giỏ hàng (Khóa học không nằm trong danh sách gợi ý hợp lệ hoặc ưu đãi đã hết hạn).');
        }
        
        const placeholders = validCartCourseIds.map(() => '?').join(',');
        const courses = await this.dataSource.query(
          `SELECT SUM(GiaBan) AS TotalPrice FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
          validCartCourseIds,
        );
        applicablePrice = courses[0]?.TotalPrice ? Number(courses[0].TotalPrice) : 0;
      } else {
        const placeholders = courseIds.map(() => '?').join(',');
        const courses = await this.dataSource.query(
          `SELECT SUM(GiaBan) AS TotalPrice FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
          courseIds,
        );
        applicablePrice = courses[0]?.TotalPrice
          ? Number(courses[0].TotalPrice)
          : 0;
      }
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
      matchedCourseId: coupon.maKH,
      matchedCourseName: coupon.tenKhoaHoc,
      discountType: coupon.loaiGiam,
      discountValue: coupon.giaTriGiam,
      discountAmount,
      message:
        coupon.maKH === null
          ? 'Áp dụng mã giảm giá toàn sàn thành công.'
          : `Áp dụng mã giảm giá cho khóa học ${coupon.tenKhoaHoc} thành công.`,
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
}
