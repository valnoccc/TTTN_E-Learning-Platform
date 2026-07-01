import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CouponsService } from './coupons.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { Coupon } from '../entities/coupon.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';

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
}
