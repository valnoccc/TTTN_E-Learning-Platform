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
import { CouponsService } from '../coupons/services/coupons.service';

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
    private readonly couponsService: CouponsService,
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
      let discountTargetCourseIds: number[] = courseIds;

      if (couponCode) {
        const coupon = await this.couponsService.validateCoupon(
          {
            maCode: couponCode,
            courseIds,
          },
          userId,
        );

        appliedCouponId = coupon.couponId;
        discountAmount = coupon.discountAmount;
        discountTargetCourseIds = coupon.targetCourseIds ?? courseIds;
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
      const discountBaseSubtotal = discountTargetCourseIds.reduce(
        (sum, courseId) => {
          const targetCourse = courses.find(
            (course: any) => Number(course.MaKH) === Number(courseId),
          );
          return sum + Number(targetCourse?.GiaBan || 0);
        },
        0,
      );
      for (const course of courses) {
        const giaGhiNhan = Number(course.GiaBan || 0);
        let doanhThuGiangVien = 0;
        if (appliedCouponId) {
          const currentCourseDiscount = discountTargetCourseIds.includes(
            Number(course.MaKH),
          )
            ? discountBaseSubtotal > 0
              ? (giaGhiNhan / discountBaseSubtotal) * discountAmount
              : 0
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

      if (appliedCouponId) {
        await this.couponsService.recordCouponRedemption(
          {
            couponId: appliedCouponId,
            userId,
            invoiceId,
            discountAmount,
            orderValue: totalOriginalPrice,
          },
          queryRunner,
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
    console.log("[IPN] Nhận request từ MoMo:", body);

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
      partnerName,
      storeId,
      storeName,
    } = body;

    // 1. Verify Signature - Tự tính lại để đối chiếu
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!accessKey || !secretKey) {
      throw new Error('Thiếu cấu hình cổng thanh toán MoMo trong hệ thống');
    }

    let rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}`;
      
    if (partnerName) rawSignature += `&partnerName=${partnerName}`;
    
    rawSignature += 
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}`;
      
    if (storeId) rawSignature += `&storeId=${storeId}`;
    if (storeName) rawSignature += `&storeName=${storeName}`;
    
    rawSignature += `&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const isValidSignature = signature === expectedSignature;
    console.log('>>> [SIGNATURE CHECK] Chữ ký nhận được:', signature);
    console.log('>>> [SIGNATURE CHECK] Chữ ký tự tính lại:', expectedSignature);
    console.log("[IPN] Kết quả check signature:", isValidSignature);

    if (!isValidSignature) {
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
      // Tìm và cập nhật trạng thái hoá đơn thành FAILED hoặc CANCELLED
      const failedStatus = resultCode === 1006 ? 'CANCELLED' : 'FAILED';
      try {
        const extraDecoded = JSON.parse(
          Buffer.from(extraData, 'base64').toString('utf8'),
        );
        const { invoiceId } = extraDecoded;
        if (invoiceId) {
          await this.dataSource.query(
            `UPDATE HoaDon SET TrangThaiThanhToan = ? WHERE MaHD = ? AND TrangThaiThanhToan = 'PENDING'`,
            [failedStatus, invoiceId],
          );
          console.log(
            '[MoMo IPN] Đã cập nhật HoaDon',
            invoiceId,
            `thành ${failedStatus}`,
          );
        }
      } catch (e) {
        console.error(`[MoMo IPN] Lỗi khi cập nhật ${failedStatus}:`, e);
      }
      return { message: `IPN received - payment ${failedStatus.toLowerCase()}` };
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

      await queryRunner.query(
        `UPDATE HoaDon SET TrangThaiThanhToan = 'PAID', NgayThanhToan = NOW() WHERE MaHD = ?`,
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
      let appliedCouponId: number | null = null;

      const existingEnrollments = await queryRunner.query(
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders}) AND TrangThai = 'ACTIVE'`,
        [userId, ...courseIds],
      );

      if (existingEnrollments.length > 0) {
        throw new BadRequestException('Bạn đã sở hữu khóa học này!');
      }

      let discountAmount = 0;
      let discountTargetCourseIds: number[] = courseIds;

      if (couponCode) {
        const couponValidation = await this.couponsService.validateCoupon(
          {
            maCode: couponCode,
            courseIds,
          },
          userId,
        );

        appliedCouponId = couponValidation.couponId;
        discountAmount = couponValidation.discountAmount;
        discountTargetCourseIds =
          couponValidation.targetCourseIds ?? courseIds;
        finalPrice = Math.max(0, totalOriginalPrice - discountAmount);
      }

      const insertHoaDonResult = await queryRunner.query(
        `INSERT INTO HoaDon (MaND, TongTien, TrangThaiThanhToan, PhuongThucThanhToan, MaCoupon, NgayThanhToan) VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, finalPrice, 'PAID', paymentMethod, appliedCouponId],
      );

      const invoiceId = insertHoaDonResult.insertId;
      const instructorRevenueRate = INSTRUCTOR_REVENUE_PERCENT;
      const discountBaseSubtotal = discountTargetCourseIds.reduce(
        (sum, courseId) => {
          const targetCourse = courses.find(
            (course: any) => Number(course.MaKH) === Number(courseId),
          );
          return sum + Number(targetCourse?.GiaBan || 0);
        },
        0,
      );

      for (const course of courses) {
        const giaGhiNhan = Number(course.GiaBan || 0);
        let doanhThuGiangVien = 0;
        if (appliedCouponId) {
          const currentCourseDiscount = discountTargetCourseIds.includes(
            Number(course.MaKH),
          )
            ? discountBaseSubtotal > 0
              ? (giaGhiNhan / discountBaseSubtotal) * discountAmount
              : 0
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
        await this.couponsService.recordCouponRedemption(
          {
            couponId: appliedCouponId,
            userId,
            invoiceId,
            discountAmount,
            orderValue: totalOriginalPrice,
          },
          queryRunner,
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
  // ─────────────────────────────────────────────────────────────────────────────
  async getAvailableCoupons(courseIdsStr: string, userId: number) {
    if (!courseIdsStr) return [];

    const courseIds = courseIdsStr
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    if (courseIds.length === 0) return [];

    // Kiểm tra xem user đã từng mua khóa học nào thành công chưa
    const paidInvoices = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM HoaDon WHERE MaND = ? AND TrangThaiThanhToan = 'PAID'`,
      [userId]
    );
    const hasPurchased = Number(paidInvoices[0]?.count || 0) > 0;

    const coupons = await this.dataSource.query(
      `SELECT MaCoupon, MaCode, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc, GhiChu, LoaiKM 
       FROM MaGiamGia 
       WHERE TrangThai = 'ACTIVE' 
         AND (NgayBatDau IS NULL OR NgayBatDau <= NOW())
         AND (NgayKetThuc IS NULL OR NgayKetThuc >= NOW())
         AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)`,
    );

    const lastInvoices = await this.dataSource.query(
      `SELECT MaHD FROM HoaDon 
       WHERE MaND = ? AND TrangThaiThanhToan = 'PAID' AND COALESCE(NgayThanhToan, NgayLap) >= NOW() - INTERVAL 30 MINUTE
       ORDER BY NgayThanhToan DESC LIMIT 1`,
      [userId]
    );
    
    let validCrossSellCourseIds: number[] = [];
    if (lastInvoices.length > 0) {
      const invoiceId = lastInvoices[0].MaHD;
      const details = await this.dataSource.query(
        `SELECT cthd.MaKH, k.MaDM FROM ChiTietHoaDon cthd JOIN KhoaHoc k ON k.MaKH = cthd.MaKH WHERE cthd.MaHD = ? LIMIT 1`,
        [invoiceId]
      );
      if (details.length > 0) {
        const oldCourseId = details[0].MaKH;
        const maDM = details[0].MaDM || 0;
        let excludeCondition = `k.MaKH != ?`;
        let params: any[] = [oldCourseId];
        excludeCondition += ` AND k.MaKH NOT IN (SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND TrangThai = 'ACTIVE')`;
        params.push(userId);
        const recommendations = await this.dataSource.query(
          `SELECT k.MaKH as maKH
           FROM KhoaHoc k
           WHERE ${excludeCondition} AND k.TrangThai = 'PUBLISHED' 
           ORDER BY (k.MaDM = ?) DESC, k.MaKH DESC LIMIT 4`,
          [...params, maDM]
        );
        validCrossSellCourseIds = recommendations.map((r: any) => Number(r.maKH));
      }
    }

    // Lấy giá các khóa học trong giỏ để tính discountAmount chính xác
    let coursePrices: any[] = [];
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      coursePrices = await this.dataSource.query(
        `SELECT MaKH, GiaBan FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
        courseIds
      );
    }
    
    const priceMap = new Map<number, number>();
    coursePrices.forEach(c => priceMap.set(Number(c.MaKH), Number(c.GiaBan)));
    
    let totalCartPrice = 0;
    courseIds.forEach(id => totalCartPrice += (priceMap.get(id) || 0));

    let totalCrossSellPrice = 0;
    const validCartCourseIds = courseIds.filter(id => validCrossSellCourseIds.includes(Number(id)));
    validCartCourseIds.forEach(id => totalCrossSellPrice += (priceMap.get(id) || 0));

    return coupons.map((coupon: any) => {
      let isAvailable = true;
      let reason: string | undefined = undefined;
      let applicablePrice = 0;

      if (coupon.LoaiKM === 'CROSS_SELL') {
        if (validCartCourseIds.length === 0) {
          isAvailable = false;
          reason = 'Mã ưu đãi đã hết hạn (quá 30 phút) hoặc không áp dụng cho khóa học trong giỏ';
          applicablePrice = totalCartPrice; // Just fallback
        } else {
          isAvailable = true;
          applicablePrice = totalCrossSellPrice;
        }
      } else {
        isAvailable = coupon.MaKH === null || courseIds.includes(Number(coupon.MaKH));
        reason = isAvailable ? undefined : 'Mã không áp dụng cho khóa học trong giỏ hàng';
        applicablePrice = coupon.MaKH === null ? totalCartPrice : (priceMap.get(Number(coupon.MaKH)) || 0);
      }

      if (isAvailable && coupon.LoaiKM === 'FIRST_TIME' && hasPurchased) {
        isAvailable = false;
        reason = 'Mã chỉ áp dụng cho lần đầu mua khóa học';
      }

      let calculatedDiscount = 0;
      if (isAvailable) {
        if (coupon.LoaiGiam === 'PERCENT') {
          calculatedDiscount = applicablePrice * Number(coupon.GiaTriGiam) / 100;
        } else {
          calculatedDiscount = Math.min(Number(coupon.GiaTriGiam), applicablePrice);
        }
      }

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
        reason,
        calculatedDiscount,
      };
    }).filter(Boolean);
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
