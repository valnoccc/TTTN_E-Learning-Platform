import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

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
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

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
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders}) AND TrangThai = 'ACTIVE'`,
        [userId, ...courseIds]
      );

      if (existingEnrollments.length > 0) {
        throw new BadRequestException('Bạn đã sở hữu khóa học này!');
      }

      // 2. Validate and apply coupon
      let coupon: any = null;
      let discountAmount = 0;

      if (couponCode) {
        const coupons = await queryRunner.query(
          `SELECT MaCoupon, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc, LoaiMa, TiLeGiangVien 
           FROM MaGiamGia WHERE MaCode = ? LIMIT 1`,
          [couponCode]
        );

        if (coupons.length === 0) {
          throw new BadRequestException('Mã giảm giá không hợp lệ');
        }

        coupon = coupons[0];
        
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

        if (coupon.MaKH !== null && !courseIds.includes(Number(coupon.MaKH))) {
          throw new BadRequestException('Mã giảm giá không áp dụng cho các khóa học trong giỏ hàng');
        }

        appliedCouponId = coupon.MaCoupon;

        let targetPrice = totalOriginalPrice; // Default to total cart price for global coupons
        if (coupon.MaKH !== null) {
          const targetCourse = courses.find((c: any) => Number(c.MaKH) === Number(coupon.MaKH));
          targetPrice = Number(targetCourse?.GiaBan || 0);
        }

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
      const instructorRevenueRate = 40.0;

      for (const course of courses) {
        const giaGhiNhan = Number(course.GiaBan || 0);
        let doanhThuGiangVien = 0;

        if (appliedCouponId) {
          const currentCourseDiscount = totalOriginalPrice > 0 ? (giaGhiNhan / totalOriginalPrice) * discountAmount : 0;
          doanhThuGiangVien = (giaGhiNhan - currentCourseDiscount) * instructorRevenueRate / 100;
        } else {
          doanhThuGiangVien = giaGhiNhan * instructorRevenueRate / 100;
        }

        await queryRunner.query(
          `INSERT INTO ChiTietHoaDon (MaHD, MaKH, GiaGhiNhan, TiLeGiangVien, DoanhThuGiangVien) VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, course.MaKH, giaGhiNhan, instructorRevenueRate, doanhThuGiangVien]
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

      // Tạo thông báo tự động sau khi thanh toán thành công
      const courseNames = courses.map((c: any) => c.TenKhoaHoc).join(', ');
      try {
        await this.notificationsService.createNotification({
          maND: userId,
          loaiThongBao: NotificationType.PAYMENT,
          tieuDe: 'Thanh toán thành công!',
          noiDung: `Bạn đã mua thành công ${courses.length} khóa học: ${courseNames}. Tổng thanh toán: ${finalPrice.toLocaleString('vi-VN')}đ. Chúc bạn học tập vui vẻ!`,
        });

        // Tạo thêm thông báo ghi danh cho từng khóa học
        for (const course of courses) {
          await this.notificationsService.createNotification({
            maND: userId,
            loaiThongBao: NotificationType.COURSE,
            tieuDe: `Ghi danh thành công: ${course.TenKhoaHoc}`,
            noiDung: `Bạn đã được ghi danh vào khóa học "${course.TenKhoaHoc}". Hãy bắt đầu học ngay!`,
          });
        }
      } catch (notifError) {
        console.error('Lỗi tạo thông báo (không ảnh hưởng thanh toán):', notifError);
      }

      return {
        success: true,
        invoiceId: invoiceId,
        enrollmentId: invoiceId,
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

  async getAvailableCoupons(courseIdsStr: string) {
    if (!courseIdsStr) return [];
    
    const courseIds = courseIdsStr.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
    if (courseIds.length === 0) return [];

    const coupons = await this.dataSource.query(
      `SELECT MaCoupon, MaCode, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc, GhiChu 
       FROM MaGiamGia 
       WHERE TrangThai = 'ACTIVE' 
         AND LoaiMa = 'PUBLIC'
         AND (NgayBatDau IS NULL OR NgayBatDau <= NOW())
         AND (NgayKetThuc IS NULL OR NgayKetThuc >= NOW())
         AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)`
    );

    return coupons.map((coupon: any) => {
      const isAvailable = coupon.MaKH === null || courseIds.includes(Number(coupon.MaKH));
      return {
        id: coupon.MaCoupon,
        code: coupon.MaCode,
        discountValue: Number(coupon.GiaTriGiam),
        discountType: coupon.LoaiGiam,
        courseId: coupon.MaKH,
        startDate: coupon.NgayBatDau,
        endDate: coupon.NgayKetThuc,
        usageLimit: coupon.SoLuongGioiHan,
        usageCount: coupon.SoLuongDaDung,
        description: coupon.GhiChu,
        isAvailable,
        reason: isAvailable ? undefined : 'Mã không áp dụng cho khóa học trong giỏ hàng'
      };
    });
  }

  async getInvoiceDetails(invoiceId: number, userId: number) {
    console.log('>>> Backend nhận Invoice ID:', invoiceId, typeof invoiceId, '| userId:', userId, typeof userId);
    
    try {
      const invoice = await this.dataSource.query(
        `SELECT MaHD, TongTien, TrangThaiThanhToan FROM HoaDon WHERE MaHD = ? AND MaND = ?`,
        [invoiceId, userId]
      );
      console.log('>>> Kết quả query HoaDon:', JSON.stringify(invoice));

      if (invoice.length === 0) {
        throw new NotFoundException(`Không tìm thấy hóa đơn với ID bằng ${invoiceId} cho user ${userId}`);
      }

      const details = await this.dataSource.query(
        `SELECT c.MaKH, c.GiaGhiNhan, k.TenKhoaHoc, k.HinhThuNho as HinhAnhDaiDien 
         FROM ChiTietHoaDon c 
         JOIN KhoaHoc k ON c.MaKH = k.MaKH 
         WHERE c.MaHD = ?`,
        [invoiceId]
      );
      console.log('>>> Kết quả query ChiTietHoaDon:', JSON.stringify(details));

      return {
        invoice: invoice[0],
        details: details
      };
    } catch (error) {
      console.error('>>> LỖI THẬT trong getInvoiceDetails:', error.message, error.query || '');
      throw error;
    }
  }
}
