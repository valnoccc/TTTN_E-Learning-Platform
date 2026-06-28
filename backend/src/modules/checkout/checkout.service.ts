import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { INSTRUCTOR_REVENUE_PERCENT } from '../../common/constants/revenue-share';
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

export interface MomoOrderData {
  courseIds: number[];
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

  // ─────────────────────────────────────────────────────────────────────────────
  // MOMO: Tạo thanh toán QR động
  // ─────────────────────────────────────────────────────────────────────────────
  async createMomoPayment(userId: number, orderData: MomoOrderData) {
    const { courseIds, couponCode, customerDetails } = orderData;

    console.log(
      '[MoMo] Bắt đầu tạo thanh toán cho userId:',
      userId,
      '| courseIds:',
      courseIds,
    );

    if (!courseIds || courseIds.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lấy thông tin khóa học
      const placeholders = courseIds.map(() => '?').join(',');
      const courses = await queryRunner.query(
        `SELECT MaKH, GiaBan, TenKhoaHoc FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
        courseIds,
      );

      if (courses.length !== courseIds.length) {
        throw new BadRequestException('Một số khóa học không tồn tại');
      }

      // 2. Kiểm tra đã sở hữu chưa
      const existingEnrollments = await queryRunner.query(
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders}) AND TrangThai = 'ACTIVE'`,
        [userId, ...courseIds],
      );

      if (existingEnrollments.length > 0) {
        throw new BadRequestException('Bạn đã sở hữu khóa học này!');
      }

      // 3. Tính tổng tiền & xử lý coupon
      const totalOriginalPrice = courses.reduce(
        (sum: number, course: any) => sum + Number(course.GiaBan || 0),
        0,
      );
      let finalPrice = totalOriginalPrice;
      let appliedCouponId: number | null = null;
      let discountAmount = 0;

      if (couponCode) {
        const coupons = await queryRunner.query(
          `SELECT MaCoupon, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc 
           FROM MaGiamGia WHERE MaCode = ? LIMIT 1`,
          [couponCode],
        );

        if (coupons.length === 0)
          throw new BadRequestException('Mã giảm giá không hợp lệ');

        const coupon = coupons[0];
        if (coupon.TrangThai !== 'ACTIVE')
          throw new BadRequestException('Mã giảm giá không còn hoạt động');

        const now = new Date();
        if (coupon.NgayBatDau && new Date(coupon.NgayBatDau) > now)
          throw new BadRequestException(
            'Mã giảm giá chưa đến thời gian sử dụng',
          );
        if (coupon.NgayKetThuc && new Date(coupon.NgayKetThuc) < now)
          throw new BadRequestException('Mã giảm giá đã hết hạn');
        if (
          coupon.SoLuongGioiHan !== null &&
          Number(coupon.SoLuongDaDung) >= Number(coupon.SoLuongGioiHan)
        )
          throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        if (coupon.MaKH !== null && !courseIds.includes(Number(coupon.MaKH)))
          throw new BadRequestException(
            'Mã giảm giá không áp dụng cho các khóa học trong giỏ hàng',
          );

        appliedCouponId = coupon.MaCoupon;
        let targetPrice = totalOriginalPrice;
        if (coupon.MaKH !== null) {
          const targetCourse = courses.find(
            (c: any) => Number(c.MaKH) === Number(coupon.MaKH),
          );
          targetPrice = Number(targetCourse?.GiaBan || 0);
        }

        discountAmount =
          coupon.LoaiGiam === 'PERCENT'
            ? (targetPrice * Number(coupon.GiaTriGiam)) / 100
            : Math.min(Number(coupon.GiaTriGiam), targetPrice);

        finalPrice = Math.max(0, totalOriginalPrice - discountAmount);
      }

      // 4. Tạo bản ghi HoaDon với trạng thái PENDING
      const orderInfo = `Thanh toan ${courses.map((c: any) => c.TenKhoaHoc).join(', ')}`;
      const insertResult = await queryRunner.query(
        `INSERT INTO HoaDon (MaND, TongTien, TrangThaiThanhToan, PhuongThucThanhToan, MaCoupon) VALUES (?, ?, ?, ?, ?)`,
        [userId, finalPrice, 'PENDING', 'MOMO', appliedCouponId],
      );
      const invoiceId: number = insertResult.insertId;

      // Lưu chi tiết hoá đơn tạm
      const instructorRevenueRate = INSTRUCTOR_REVENUE_PERCENT;
      for (const course of courses) {
        const giaGhiNhan = Number(course.GiaBan || 0);
        let doanhThuGiangVien = 0;
        if (appliedCouponId) {
          const currentCourseDiscount =
            totalOriginalPrice > 0
              ? (giaGhiNhan / totalOriginalPrice) * discountAmount
              : 0;
          doanhThuGiangVien =
            ((giaGhiNhan - currentCourseDiscount) * instructorRevenueRate) /
            100;
        } else {
          doanhThuGiangVien = (giaGhiNhan * instructorRevenueRate) / 100;
        }
        await queryRunner.query(
          `INSERT INTO ChiTietHoaDon (MaHD, MaKH, GiaGhiNhan, TiLeGiangVien, DoanhThuGiangVien) VALUES (?, ?, ?, ?, ?)`,
          [
            invoiceId,
            course.MaKH,
            giaGhiNhan,
            instructorRevenueRate,
            doanhThuGiangVien,
          ],
        );
      }

      await queryRunner.commitTransaction();
      console.log('[MoMo] Đã tạo HoaDon PENDING, invoiceId:', invoiceId);

      // 5. Tạo chữ ký & gọi MoMo API
      const partnerCode = process.env.MOMO_PARTNER_CODE;
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const momoEndpoint =
        process.env.MOMO_ENDPOINT ||
        'https://test-payment.momo.vn/v2/gateway/api/create';
      const redirectUrl =
        process.env.MOMO_REDIRECT_URL ||
        'http://localhost:5173/checkout/success';
      const ipnUrl = process.env.MOMO_NOTIFY_URL;

      if (!partnerCode || !accessKey || !secretKey || !ipnUrl) {
        throw new Error('Thiếu cấu hình cổng thanh toán MoMo trong hệ thống');
      }

      const requestId = `${partnerCode}-${invoiceId}-${Date.now()}`;
      const orderId = `ORDER-${invoiceId}-${Date.now()}`;
      const amount = String(Math.round(finalPrice));
      const extraData = Buffer.from(
        JSON.stringify({ invoiceId, userId, courseIds, appliedCouponId }),
      ).toString('base64');

      // Chuỗi rawSignature theo đúng tài liệu MoMo
      const rawSignature =
        `accessKey=${accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&ipnUrl=${ipnUrl}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&partnerCode=${partnerCode}` +
        `&redirectUrl=${redirectUrl}` +
        `&requestId=${requestId}` +
        `&requestType=payWithMethod`;

      console.log('[MoMo] rawSignature:', rawSignature);

      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      console.log('[MoMo] signature:', signature);

      const momoPayload = {
        partnerCode,
        partnerName: 'Edumeo E-Learning',
        storeName: 'Edumeo',
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        lang: 'vi',
        requestType: 'payWithMethod',
        signature,
      };

      console.log(
        '[MoMo] Gửi payload đến MoMo:',
        JSON.stringify(momoPayload, null, 2),
      );

      const momoRes = await axios.post(momoEndpoint, momoPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      console.log(
        '[MoMo] Phản hồi từ MoMo:',
        JSON.stringify(momoRes.data, null, 2),
      );

      if (momoRes.data.resultCode !== 0) {
        throw new InternalServerErrorException(
          `MoMo từ chối tạo thanh toán: ${momoRes.data.message} (code: ${momoRes.data.resultCode})`,
        );
      }

      return {
        success: true,
        payUrl: momoRes.data.payUrl,
        invoiceId,
        orderId,
        qrCodeUrl: momoRes.data.qrCodeUrl,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error(
        '[MoMo] Lỗi tạo thanh toán:',
        error.message,
        error.response?.data || '',
      );
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Lỗi kết nối MoMo: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MOMO: Xử lý IPN Webhook (MoMo gọi vào sau khi user thanh toán)
  // ─────────────────────────────────────────────────────────────────────────────
  async handleMomoIPN(body: any) {
    console.log('[MoMo IPN] Nhận được webhook:', JSON.stringify(body, null, 2));

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    // 1. Verify Signature - Tự tính lại để đối chiếu
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!accessKey || !secretKey) {
      throw new Error('Thiếu cấu hình cổng thanh toán MoMo trong hệ thống');
    }

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    console.log('>>> [SIGNATURE CHECK] Chữ ký nhận được:', signature);
    console.log('>>> [SIGNATURE CHECK] Chữ ký tự tính lại:', expectedSignature);

    if (signature !== expectedSignature) {
      console.error('[MoMo IPN] Chữ ký KHÔNG hợp lệ! Có thể là giả mạo.');
      throw new UnauthorizedException('Chữ ký MoMo không hợp lệ!');
    }

    console.log('[MoMo IPN] Chữ ký hợp lệ. resultCode:', resultCode);

    // 2. Chỉ xử lý khi thanh toán thành công (resultCode === 0)
    if (resultCode !== 0) {
      console.log(
        '[MoMo IPN] Thanh toán THẤT BẠI hoặc bị huỷ. resultCode:',
        resultCode,
        '| message:',
        message,
      );
      // Tìm và cập nhật trạng thái hoá đơn thành FAILED
      try {
        const extraDecoded = JSON.parse(
          Buffer.from(extraData, 'base64').toString('utf8'),
        );
        const { invoiceId } = extraDecoded;
        if (invoiceId) {
          await this.dataSource.query(
            `UPDATE HoaDon SET TrangThaiThanhToan = 'FAILED' WHERE MaHD = ? AND TrangThaiThanhToan = 'PENDING'`,
            [invoiceId],
          );
          console.log(
            '[MoMo IPN] Đã cập nhật HoaDon',
            invoiceId,
            'thành FAILED',
          );
        }
      } catch (e) {
        console.error('[MoMo IPN] Lỗi khi cập nhật FAILED:', e);
      }
      return { message: 'IPN received - payment failed' };
    }

    // 3. Decode extraData để lấy invoiceId, userId, courseIds
    let extraDecoded: any;
    try {
      extraDecoded = JSON.parse(
        Buffer.from(extraData || '', 'base64').toString('utf8'),
      );
    } catch (e) {
      console.error('[MoMo IPN] Lỗi decode extraData:', e);
      throw new BadRequestException('extraData không hợp lệ');
    }

    console.log(
      '[MoMo IPN] extraData RAW decoded (trước khi validate):',
      JSON.stringify(extraDecoded),
    );

    // ── PHÒNG VỆ: Bóc tách & validate từng trường từ extraDecoded ──────────────
    const rawCourseIds = extraDecoded.courseIds;
    const rawInvoiceId = extraDecoded.invoiceId;
    const rawUserId = extraDecoded.userId;
    const appliedCouponId = extraDecoded.appliedCouponId ?? null;

    console.log('[MoMo IPN] extraData decoded fields:', {
      rawInvoiceId,
      rawUserId,
      rawCourseIds,
      appliedCouponId,
    });

    // Validate invoiceId & userId thành số nguyên an toàn
    const invoiceId = parseInt(rawInvoiceId, 10);
    const userId = parseInt(rawUserId, 10);
    if (isNaN(invoiceId))
      throw new BadRequestException(
        `invoiceId không hợp lệ (NaN): "${rawInvoiceId}"`,
      );
    if (isNaN(userId))
      throw new BadRequestException(
        `userId không hợp lệ (NaN): "${rawUserId}"`,
      );

    // Validate & ép kiểu toàn bộ courseIds — đây là nguồn gốc lỗi ER_BAD_FIELD_ERROR
    if (
      !rawCourseIds ||
      !Array.isArray(rawCourseIds) ||
      rawCourseIds.length === 0
    ) {
      throw new BadRequestException(
        `Không tìm thấy danh sách mã khóa học trong extraData! rawCourseIds = ${JSON.stringify(rawCourseIds)}`,
      );
    }
    const validCourseIds: number[] = rawCourseIds.map((id: any) => {
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        throw new BadRequestException(
          `Mã khóa học không hợp lệ (NaN): "${id}"`,
        );
      }
      return parsedId;
    });
    console.log(
      '[MoMo IPN] validCourseIds sau khi ép kiểu parseInt:',
      validCourseIds,
    );

    // 4. Dùng transaction để cập nhật DB
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4a. Kiểm tra hoá đơn tồn tại & còn PENDING
      const invoices = await queryRunner.query(
        `SELECT MaHD, TrangThaiThanhToan FROM HoaDon WHERE MaHD = ?`,
        [invoiceId],
      );

      if (invoices.length === 0) {
        throw new NotFoundException(`Không tìm thấy hoá đơn ${invoiceId}`);
      }

      if (invoices[0].TrangThaiThanhToan === 'PAID') {
        console.log(
          '[MoMo IPN] Hoá đơn',
          invoiceId,
          'đã PAID trước đó, bỏ qua.',
        );
        await queryRunner.rollbackTransaction();
        return { message: 'IPN already processed' };
      }

      // 4b. Cập nhật HoaDon thành PAID
      await queryRunner.query(
        `UPDATE HoaDon SET TrangThaiThanhToan = 'PAID' WHERE MaHD = ?`,
        [invoiceId],
      );
      console.log('[MoMo IPN] Đã cập nhật HoaDon', invoiceId, 'thành PAID');

      // 4c. Ghi danh học viên — dùng validCourseIds đã được làm sạch
      const placeholders = validCourseIds.map(() => '?').join(',');
      // Kiểm tra đã ghi danh chưa (idempotency)
      const existing = await queryRunner.query(
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders}) AND TrangThai = 'ACTIVE'`,
        [userId, ...validCourseIds],
      );
      const existingCourseIds = existing.map((e: any) => Number(e.MaKH));

      for (const courseId of validCourseIds) {
        if (!existingCourseIds.includes(courseId)) {
          await queryRunner.query(
            `INSERT INTO DangKyKhoaHoc (MaND, MaKH, MaHD, TrangThai) VALUES (?, ?, ?, ?)`,
            [userId, courseId, invoiceId, 'ACTIVE'],
          );
          console.log(
            '[MoMo IPN] Đã ghi danh userId:',
            userId,
            '| courseId:',
            courseId,
          );
        } else {
          console.log(
            '[MoMo IPN] Bỏ qua ghi danh (đã tồn tại) userId:',
            userId,
            '| courseId:',
            courseId,
          );
        }
      }

      // 4d. Cập nhật số lượt dùng coupon (nếu có)
      if (appliedCouponId) {
        await queryRunner.query(
          `UPDATE MaGiamGia SET SoLuongDaDung = SoLuongDaDung + 1 WHERE MaCoupon = ?`,
          [appliedCouponId],
        );
        console.log(
          '[MoMo IPN] Đã tăng SoLuongDaDung cho coupon:',
          appliedCouponId,
        );
      }

      await queryRunner.commitTransaction();
      console.log(
        '[MoMo IPN] Transaction COMMIT thành công cho invoiceId:',
        invoiceId,
      );

      // 5. Tạo thông báo (sau commit, không rollback nếu lỗi thông báo)
      try {
        const courses = await this.dataSource.query(
          `SELECT k.TenKhoaHoc FROM ChiTietHoaDon c JOIN KhoaHoc k ON c.MaKH = k.MaKH WHERE c.MaHD = ?`,
          [invoiceId],
        );
        const courseNames = courses.map((c: any) => c.TenKhoaHoc).join(', ');

        await this.notificationsService.createNotification({
          maND: userId,
          loaiThongBao: NotificationType.PAYMENT,
          tieuDe: 'Thanh toán MoMo thành công! 🎉',
          noiDung: `Bạn đã thanh toán thành công qua MoMo cho khóa học: ${courseNames}. Chúc bạn học tập vui vẻ!`,
        });

        for (const course of courses) {
          await this.notificationsService.createNotification({
            maND: userId,
            loaiThongBao: NotificationType.COURSE,
            tieuDe: `Ghi danh thành công: ${course.TenKhoaHoc}`,
            noiDung: `Bạn đã được ghi danh vào khóa học "${course.TenKhoaHoc}". Hãy bắt đầu học ngay!`,
          });
        }
      } catch (notifError) {
        console.error(
          '[MoMo IPN] Lỗi tạo thông báo (không ảnh hưởng kết quả):',
          notifError,
        );
      }

      return { message: 'IPN processed successfully', invoiceId };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('>>> [IPN CRASH] Lỗi xử lý DB Transaction:', error);
      console.error('>>> [IPN CRASH] error.message:', error?.message);
      console.error('>>> [IPN CRASH] error.stack:', error?.stack);
      throw new InternalServerErrorException(`Lỗi xử lý IPN: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Thanh toán thủ công (giữ nguyên cho BANK / VNPAY / PAYPAL)
  // ─────────────────────────────────────────────────────────────────────────────
  async processPayment(payload: PaymentRequest, userId: number) {
    const { courseIds, paymentMethod, couponCode } = payload;

    if (!courseIds || courseIds.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const placeholders = courseIds.map(() => '?').join(',');
      const courses = await queryRunner.query(
        `SELECT MaKH, GiaBan, TenKhoaHoc FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
        courseIds,
      );

      if (courses.length !== courseIds.length) {
        throw new BadRequestException('Một số khóa học không tồn tại');
      }

      const totalOriginalPrice = courses.reduce(
        (sum: number, course: any) => sum + Number(course.GiaBan || 0),
        0,
      );
      let finalPrice = totalOriginalPrice;
      let appliedCouponId = null;

      const existingEnrollments = await queryRunner.query(
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders}) AND TrangThai = 'ACTIVE'`,
        [userId, ...courseIds],
      );

      if (existingEnrollments.length > 0) {
        throw new BadRequestException('Bạn đã sở hữu khóa học này!');
      }

      let coupon: any = null;
      let discountAmount = 0;

      if (couponCode) {
        const coupons = await queryRunner.query(
          `SELECT MaCoupon, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc, LoaiMa, TiLeGiangVien 
           FROM MaGiamGia WHERE MaCode = ? LIMIT 1`,
          [couponCode],
        );

        if (coupons.length === 0)
          throw new BadRequestException('Mã giảm giá không hợp lệ');

        coupon = coupons[0];
        if (coupon.TrangThai !== 'ACTIVE')
          throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');

        const now = new Date();
        if (coupon.NgayBatDau && new Date(coupon.NgayBatDau) > now)
          throw new BadRequestException(
            'Mã giảm giá chưa đến thời gian sử dụng',
          );
        if (coupon.NgayKetThuc && new Date(coupon.NgayKetThuc) < now)
          throw new BadRequestException('Mã giảm giá đã hết hạn');
        if (
          coupon.SoLuongGioiHan !== null &&
          Number(coupon.SoLuongDaDung) >= Number(coupon.SoLuongGioiHan)
        )
          throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        if (coupon.MaKH !== null && !courseIds.includes(Number(coupon.MaKH)))
          throw new BadRequestException(
            'Mã giảm giá không áp dụng cho các khóa học trong giỏ hàng',
          );

        appliedCouponId = coupon.MaCoupon;

        let targetPrice = totalOriginalPrice;
        if (coupon.MaKH !== null) {
          const targetCourse = courses.find(
            (c: any) => Number(c.MaKH) === Number(coupon.MaKH),
          );
          targetPrice = Number(targetCourse?.GiaBan || 0);
        }

        discountAmount =
          coupon.LoaiGiam === 'PERCENT'
            ? (targetPrice * Number(coupon.GiaTriGiam)) / 100
            : Math.min(Number(coupon.GiaTriGiam), targetPrice);

        finalPrice = Math.max(0, totalOriginalPrice - discountAmount);
      }

      const insertHoaDonResult = await queryRunner.query(
        `INSERT INTO HoaDon (MaND, TongTien, TrangThaiThanhToan, PhuongThucThanhToan, MaCoupon) VALUES (?, ?, ?, ?, ?)`,
        [userId, finalPrice, 'PAID', paymentMethod, appliedCouponId],
      );

      const invoiceId = insertHoaDonResult.insertId;
      const instructorRevenueRate = INSTRUCTOR_REVENUE_PERCENT;

      for (const course of courses) {
        const giaGhiNhan = Number(course.GiaBan || 0);
        let doanhThuGiangVien = 0;
        if (appliedCouponId) {
          const currentCourseDiscount =
            totalOriginalPrice > 0
              ? (giaGhiNhan / totalOriginalPrice) * discountAmount
              : 0;
          doanhThuGiangVien =
            ((giaGhiNhan - currentCourseDiscount) * instructorRevenueRate) /
            100;
        } else {
          doanhThuGiangVien = (giaGhiNhan * instructorRevenueRate) / 100;
        }

        await queryRunner.query(
          `INSERT INTO ChiTietHoaDon (MaHD, MaKH, GiaGhiNhan, TiLeGiangVien, DoanhThuGiangVien) VALUES (?, ?, ?, ?, ?)`,
          [
            invoiceId,
            course.MaKH,
            giaGhiNhan,
            instructorRevenueRate,
            doanhThuGiangVien,
          ],
        );

        await queryRunner.query(
          `INSERT INTO DangKyKhoaHoc (MaND, MaKH, MaHD, TrangThai) VALUES (?, ?, ?, ?)`,
          [userId, course.MaKH, invoiceId, 'ACTIVE'],
        );
      }

      if (appliedCouponId) {
        await queryRunner.query(
          `UPDATE MaGiamGia SET SoLuongDaDung = SoLuongDaDung + 1 WHERE MaCoupon = ?`,
          [appliedCouponId],
        );
      }

      await queryRunner.commitTransaction();

      const courseNames = courses.map((c: any) => c.TenKhoaHoc).join(', ');
      try {
        await this.notificationsService.createNotification({
          maND: userId,
          loaiThongBao: NotificationType.PAYMENT,
          tieuDe: 'Thanh toán thành công!',
          noiDung: `Bạn đã mua thành công ${courses.length} khóa học: ${courseNames}. Tổng thanh toán: ${finalPrice.toLocaleString('vi-VN')}đ. Chúc bạn học tập vui vẻ!`,
        });

        for (const course of courses) {
          await this.notificationsService.createNotification({
            maND: userId,
            loaiThongBao: NotificationType.COURSE,
            tieuDe: `Ghi danh thành công: ${course.TenKhoaHoc}`,
            noiDung: `Bạn đã được ghi danh vào khóa học "${course.TenKhoaHoc}". Hãy bắt đầu học ngay!`,
          });
        }
      } catch (notifError) {
        console.error(
          'Lỗi tạo thông báo (không ảnh hưởng thanh toán):',
          notifError,
        );
      }

      return {
        success: true,
        invoiceId: invoiceId,
        enrollmentId: invoiceId,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      console.error('Payment Transaction Error:', error);
      throw new InternalServerErrorException(`Lỗi hệ thống: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Lấy danh sách voucher khả dụng
  // ─────────────────────────────────────────────────────────────────────────────
  async getAvailableCoupons(courseIdsStr: string) {
    if (!courseIdsStr) return [];

    const courseIds = courseIdsStr
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    if (courseIds.length === 0) return [];

    const coupons = await this.dataSource.query(
      `SELECT MaCoupon, MaCode, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc, GhiChu 
       FROM MaGiamGia 
       WHERE TrangThai = 'ACTIVE' 
         AND LoaiMa = 'PUBLIC'
         AND (NgayBatDau IS NULL OR NgayBatDau <= NOW())
         AND (NgayKetThuc IS NULL OR NgayKetThuc >= NOW())
         AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)`,
    );

    return coupons.map((coupon: any) => {
      const isAvailable =
        coupon.MaKH === null || courseIds.includes(Number(coupon.MaKH));
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
        reason: isAvailable
          ? undefined
          : 'Mã không áp dụng cho khóa học trong giỏ hàng',
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Lấy chi tiết hoá đơn
  // ─────────────────────────────────────────────────────────────────────────────
  async getInvoiceDetails(invoiceId: number, userId: number) {
    console.log(
      '>>> Backend nhận Invoice ID:',
      invoiceId,
      typeof invoiceId,
      '| userId:',
      userId,
      typeof userId,
    );

    try {
      const invoice = await this.dataSource.query(
        `SELECT MaHD, TongTien, TrangThaiThanhToan FROM HoaDon WHERE MaHD = ? AND MaND = ?`,
        [invoiceId, userId],
      );
      console.log('>>> Kết quả query HoaDon:', JSON.stringify(invoice));

      if (invoice.length === 0) {
        throw new NotFoundException(
          `Không tìm thấy hóa đơn với ID bằng ${invoiceId} cho user ${userId}`,
        );
      }

      const details = await this.dataSource.query(
        `SELECT c.MaKH, c.GiaGhiNhan, k.TenKhoaHoc, k.HinhThuNho as HinhAnhDaiDien 
         FROM ChiTietHoaDon c 
         JOIN KhoaHoc k ON c.MaKH = k.MaKH 
         WHERE c.MaHD = ?`,
        [invoiceId],
      );
      console.log('>>> Kết quả query ChiTietHoaDon:', JSON.stringify(details));

      return {
        invoice: invoice[0],
        details: details,
      };
    } catch (error: any) {
      console.error(
        '>>> LỖI THẬT trong getInvoiceDetails:',
        error.message,
        error.query || '',
      );
      throw error;
    }
  }
}
