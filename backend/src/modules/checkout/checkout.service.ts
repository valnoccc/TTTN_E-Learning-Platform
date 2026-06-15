import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface PaymentRequest {
  courseIds: number[];
  paymentMethod: string;
  couponCode?: string;
  customerDetails: {
    fullName: string;
    email: string;
    phone: string;
  };
}

@Injectable()
export class CheckoutService {
  constructor(private readonly dataSource: DataSource) {}

  async processPayment(payload: PaymentRequest, userId: number) {
    const { courseIds, paymentMethod, couponCode } = payload;
    
    if (!courseIds || courseIds.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Calculate total price
      const placeholders = courseIds.map(() => '?').join(',');
      const courses = await queryRunner.query(
        `SELECT MaKH, GiaBan, TenKhoaHoc FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
        courseIds
      );

      if (courses.length !== courseIds.length) {
        throw new BadRequestException('Một số khóa học không tồn tại');
      }

      const totalOriginalPrice = courses.reduce((sum: number, course: any) => sum + Number(course.GiaBan || 0), 0);
      let finalPrice = totalOriginalPrice;
      let appliedCouponId = null;

      // 1.5. Check if user already owns any of the courses
      const existingEnrollments = await queryRunner.query(
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders})`,
        [userId, ...courseIds]
      );

      if (existingEnrollments.length > 0) {
        const ownedCourseIds = existingEnrollments.map((e: any) => e.MaKH);
        const ownedCourseNames = courses
          .filter((c: any) => ownedCourseIds.includes(c.MaKH))
          .map((c: any) => c.TenKhoaHoc)
          .join(', ');
        throw new BadRequestException(`Bạn đã sở hữu khóa học: ${ownedCourseNames}`);
      }

      // 2. Validate and apply coupon
      if (couponCode) {
        const coupons = await queryRunner.query(
          `SELECT MaCoupon, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc 
           FROM MaGiamGia WHERE MaCode = ? LIMIT 1`,
          [couponCode]
        );

        if (coupons.length === 0) {
          throw new BadRequestException('Mã giảm giá không hợp lệ');
        }

        const coupon = coupons[0];
        
        if (coupon.TrangThai !== 'ACTIVE') {
          throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
        }

        const now = new Date();
        if (coupon.NgayBatDau && new Date(coupon.NgayBatDau) > now) {
          throw new BadRequestException('Mã giảm giá chưa đến thời gian sử dụng');
        }

        if (coupon.NgayKetThuc && new Date(coupon.NgayKetThuc) < now) {
          throw new BadRequestException('Mã giảm giá đã hết hạn');
        }

        if (coupon.SoLuongGioiHan !== null && Number(coupon.SoLuongDaDung) >= Number(coupon.SoLuongGioiHan)) {
          throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        }

        if (!courseIds.includes(Number(coupon.MaKH))) {
          throw new BadRequestException('Mã giảm giá không áp dụng cho các khóa học trong giỏ hàng');
        }

        appliedCouponId = coupon.MaCoupon;

        const targetCourse = courses.find((c: any) => Number(c.MaKH) === Number(coupon.MaKH));
        const targetPrice = Number(targetCourse.GiaBan);

        let discountAmount = 0;
        if (coupon.LoaiGiam === 'PERCENT') {
          discountAmount = (targetPrice * Number(coupon.GiaTriGiam)) / 100;
        } else {
          discountAmount = Math.min(Number(coupon.GiaTriGiam), targetPrice);
        }

        finalPrice = Math.max(0, totalOriginalPrice - discountAmount);
      }

      // 3. Insert into HoaDon
      const insertHoaDonResult = await queryRunner.query(
        `INSERT INTO HoaDon (MaND, TongTien, TrangThaiThanhToan, PhuongThucThanhToan, MaCoupon)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, finalPrice, 'PAID', paymentMethod, appliedCouponId]
      );

      const invoiceId = insertHoaDonResult.insertId;

      // 4. Insert into ChiTietHoaDon and 5. Insert into DangKyKhoaHoc
      for (const course of courses) {
        await queryRunner.query(
          `INSERT INTO ChiTietHoaDon (MaHD, MaKH, GiaGhiNhan) VALUES (?, ?, ?)`,
          [invoiceId, course.MaKH, Number(course.GiaBan || 0)]
        );

        await queryRunner.query(
          `INSERT INTO DangKyKhoaHoc (MaND, MaKH, MaHD, TrangThai) VALUES (?, ?, ?, ?)`,
          [userId, course.MaKH, invoiceId, 'ACTIVE']
        );
      }

      // 6. Update MaGiamGia
      if (appliedCouponId) {
        await queryRunner.query(
          `UPDATE MaGiamGia SET SoLuongDaDung = SoLuongDaDung + 1 WHERE MaCoupon = ?`,
          [appliedCouponId]
        );
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        invoiceId: invoiceId,
        enrollmentId: invoiceId, // Using invoiceId as enrollment reference
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Payment Transaction Error:', error);
      throw new InternalServerErrorException(`Lỗi hệ thống: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
