import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CreateCouponDto } from '../dto/create-coupon.dto';
import { QueryCouponsDto } from '../dto/query-coupons.dto';
import { UpdateCouponStatusDto } from '../dto/update-coupon-status.dto';
import { Coupon } from '../entities/coupon.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';
import { CouponsService } from './coupons.service';

@Injectable()
export class InstructorCouponsService extends CouponsService {
  constructor(
    @InjectRepository(Coupon)
    couponRepository: any,
    @InjectRepository(KhoaHoc)
    courseRepository: any,
    dataSource: DataSource,
  ) {
    super(couponRepository, courseRepository, dataSource);
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
    trangThai: UpdateCouponStatusDto['trangThai'],
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
}
