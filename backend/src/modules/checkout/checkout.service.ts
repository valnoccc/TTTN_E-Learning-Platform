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
import { StudentCouponsService } from '../coupons/services/student-coupons.service';

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
    private readonly couponsService: StudentCouponsService,
  ) {}

  private normalizeMomoResultCode(resultCode: unknown): number {
    const parsed = Number(resultCode);
    return Number.isFinite(parsed) ? parsed : -1;
  }

  private buildMomoResponseSignature(body: any, accessKey: string) {
    const {
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      partnerName,
      payType,
      requestId,
      responseTime,
      resultCode,
      storeId,
      storeName,
      transId,
    } = body;

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

    return rawSignature;
  }

  private verifyMomoResponseSignature(body: any) {
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!accessKey || !secretKey) {
      throw new Error('Thiếu cấu hình cổng thanh toán MoMo trong hệ thống');
    }

    const rawSignature = this.buildMomoResponseSignature(body, accessKey);
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const isValidSignature = body.signature === expectedSignature;
    if (!isValidSignature) {
      console.error('[MoMo IPN] Chữ ký KHÔNG hợp lệ! Có thể là giả mạo.');
      throw new UnauthorizedException('Chữ ký MoMo không hợp lệ!');
    }
  }

  private decodeMomoExtraData(extraData?: string) {
    try {
      return JSON.parse(
        Buffer.from(extraData || '', 'base64').toString('utf8'),
      );
    } catch (e) {
      console.error('[MoMo] Lỗi decode extraData:', e);
      throw new BadRequestException('extraData không hợp lệ');
    }
  }

  private getFailedMomoStatus(resultCode: number) {
    // MoMo error codes should be surfaced as a payment failure in our system.
    // We intentionally avoid keeping a separate "cancelled" state here so
    // checkout history and notifications stay consistent for OTP timeout,
    // insufficient funds, locked card, and similar failed attempts.
    return 'FAILED';
  }

  private toAffectedRows(result: any) {
    if (Array.isArray(result)) {
      return Number(result[0]?.affectedRows ?? 0);
    }

    return Number(result?.affectedRows ?? 0);
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

  // ────────────────────────────────────────────────────────────────────────────────
  // MOMO: Tạo thanh toán QR động
  // ────────────────────────────────────────────────────────────────────────────────
  async createMomoPayment(userId: number, orderData: MomoOrderData) {
    const { courseIds, couponCode, customerDetails } = orderData;

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

      await queryRunner.commitTransaction();

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

      // TẠM THỜI ĐỂ payWithATM ĐỂ BẠN TEST LỖI SANDBOX.
      // Khi lên Production hoặc muốn dùng cổng chung thì đổi thành 'payWithMethod'
      const requestType = 'payWithATM';

      // Chuỗi rawSignature dùng biến requestType
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
        `&requestType=${requestType}`;

      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

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
        requestType: requestType, // Sử dụng chung 1 biến
        signature,
      };

      const momoRes = await axios.post(momoEndpoint, momoPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

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
      // ĐÃ SỬA: Chỉ rollback nếu transaction chưa bị commit
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

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
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async handleMomoIPN(body: any) {
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

    // 1. Verify Signature
    this.verifyMomoResponseSignature(body);
    const momoResultCode = this.normalizeMomoResultCode(resultCode);

    // 2. Chỉ xử lý khi thanh toán thành công (resultCode === 0)
    if (momoResultCode !== 0) {
      const failedStatus = this.getFailedMomoStatus(momoResultCode);
      try {
        const extraDecoded = this.decodeMomoExtraData(extraData);
        const { invoiceId } = extraDecoded;
        if (invoiceId) {
          const updateResult = await this.dataSource.query(
            `UPDATE HoaDon SET TrangThaiThanhToan = ? WHERE MaHD = ? AND TrangThaiThanhToan = 'PENDING'`,
            [failedStatus, invoiceId],
          );

          const affectedRows = Array.isArray(updateResult)
            ? Number(updateResult[0]?.affectedRows ?? 0)
            : Number(updateResult?.affectedRows ?? 0);
          if (affectedRows === 0) {
            return {
              message: `IPN already processed - payment ${failedStatus.toLowerCase()}`,
            };
          }

          const courseIds = Array.isArray(extraDecoded.courseIds)
            ? extraDecoded.courseIds
                .map((courseId: any) => Number.parseInt(courseId, 10))
                .filter((courseId: number) => Number.isFinite(courseId))
            : [];
          const failedCourses = courseIds.length
            ? await this.dataSource.query(
                `SELECT TenKhoaHoc FROM KhoaHoc WHERE MaKH IN (${courseIds
                  .map(() => '?')
                  .join(',')})`,
                courseIds,
              )
            : [];
          const courseNames = failedCourses
            .map((course: any) => course.TenKhoaHoc)
            .filter(Boolean)
            .join(', ');

          await this.notificationsService.createNotification({
            maND: Number.parseInt(extraDecoded.userId, 10),
            loaiThongBao: NotificationType.PAYMENT,
            tieuDe: `Thanh toán MoMo thất bại${invoiceId ? ` #${invoiceId}` : ''}`,
            noiDung: courseNames
              ? `MoMo đã trả về trạng thái ${failedStatus.toLowerCase()} cho khóa học: ${courseNames}. Vui lòng thử lại nếu bạn vẫn muốn mua khóa học này.`
              : `MoMo đã trả về trạng thái ${failedStatus.toLowerCase()} cho đơn hàng #${invoiceId}. Vui lòng thử lại nếu bạn vẫn muốn mua khóa học này.`,
          });
        }
      } catch (e) {
        console.error(`[MoMo IPN] Lỗi khi cập nhật ${failedStatus}:`, e);
      }
      return {
        message: `IPN received - payment ${failedStatus.toLowerCase()}`,
      };
    }

    // 3. Decode extraData
    let extraDecoded: any;
    extraDecoded = this.decodeMomoExtraData(extraData);

    const rawCourseIds = extraDecoded.courseIds;
    const rawInvoiceId = extraDecoded.invoiceId;
    const rawUserId = extraDecoded.userId;
    const appliedCouponId = extraDecoded.appliedCouponId ?? null;

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
        await queryRunner.rollbackTransaction();
        return { message: 'IPN already processed' };
      }

      const paymentUpdateResult = await queryRunner.query(
        `UPDATE HoaDon SET TrangThaiThanhToan = 'PAID', NgayThanhToan = NOW() WHERE MaHD = ? AND TrangThaiThanhToan = 'PENDING'`,
        [invoiceId],
      );

      if (this.toAffectedRows(paymentUpdateResult) === 0) {
        await queryRunner.rollbackTransaction();
        return { message: 'IPN already processed' };
      }

      // 4c. Ghi danh học viên
      const placeholders = validCourseIds.map(() => '?').join(',');
      const existing = await queryRunner.query(
        `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH IN (${placeholders}) AND TrangThai = 'ACTIVE'`,
        [userId, ...validCourseIds],
      );
      const existingCourseIds = existing.map((e: any) => Number(e.MaKH));

      for (const courseId of validCourseIds) {
        if (!existingCourseIds.includes(courseId)) {
          // Wrap in try-catch in case the DB schema hasn't been fixed yet for (MaND, MaKH) composite key
          try {
            await queryRunner.query(
              `INSERT INTO DangKyKhoaHoc (MaND, MaKH, MaHD, TrangThai) VALUES (?, ?, ?, ?)`,
              [userId, courseId, invoiceId, 'ACTIVE'],
            );
          } catch (insertError: any) {
            console.warn(
              `[MoMo IPN] Cảnh báo bỏ qua lỗi insert khoá học (Có thể do lỗi schema DB ER_DUP_ENTRY):`,
              insertError.message,
            );
          }
        }
      }

      // 4d. Ghi nhận coupon đã được tài khoản này sử dụng
      if (appliedCouponId) {
        const [invoiceRows, detailRows] = await Promise.all([
          queryRunner.query(
            `SELECT TongTien FROM HoaDon WHERE MaHD = ? LIMIT 1`,
            [invoiceId],
          ),
          queryRunner.query(
            `SELECT COALESCE(SUM(GiaGhiNhan), 0) AS totalOrderValue
             FROM ChiTietHoaDon
             WHERE MaHD = ?`,
            [invoiceId],
          ),
        ]);

        const orderValue = Number(detailRows?.[0]?.totalOrderValue ?? 0);
        const paidAmount = Number(invoiceRows?.[0]?.TongTien ?? 0);
        const discountAmount = Math.max(0, orderValue - paidAmount);

        await this.couponsService.recordCouponRedemption(
          {
            couponId: appliedCouponId,
            userId,
            invoiceId,
            discountAmount,
            orderValue,
          },
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

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
      // ĐÃ SỬA: Chỉ rollback nếu transaction chưa bị commit
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error('>>> [IPN CRASH] Lỗi xử lý DB Transaction:', error);
      throw new InternalServerErrorException(`Lỗi xử lý IPN: ${error.message}`);
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Thanh toán thủ công (giữ nguyên cho BANK / VNPAY / PAYPAL)
  // ────────────────────────────────────────────────────────────────────────────────
  async handleMomoReturn(body: any, currentUserId: number) {
    this.verifyMomoResponseSignature(body);

    const extraDecoded = this.decodeMomoExtraData(body.extraData);
    const invoiceId = parseInt(extraDecoded.invoiceId, 10);
    const userId = parseInt(extraDecoded.userId, 10);
    const resultCode = this.normalizeMomoResultCode(body.resultCode);

    if (isNaN(invoiceId)) {
      throw new BadRequestException(
        `invoiceId không hợp lệ (NaN): "${extraDecoded.invoiceId}"`,
      );
    }
    if (isNaN(userId) || Number(currentUserId) !== userId) {
      throw new UnauthorizedException(
        'Thông tin thanh toán không thuộc user hiện tại',
      );
    }

    const ipnResult = await this.handleMomoIPN(body);
    const paymentStatus =
      resultCode === 0 ? 'PAID' : this.getFailedMomoStatus(resultCode);

    return {
      ...ipnResult,
      invoiceId,
      resultCode,
      paymentStatus,
      message:
        resultCode === 0
          ? 'Thanh toán MoMo đã được xác nhận'
          : body.message || 'Thanh toán MoMo không thành công',
    };
  }

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
        discountTargetCourseIds = couponValidation.targetCourseIds ?? courseIds;
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
      // ĐÃ SỬA: Chỉ rollback nếu transaction chưa bị commit
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (error instanceof BadRequestException) throw error;
      console.error('Payment Transaction Error:', error);
      throw new InternalServerErrorException(`Lỗi hệ thống: ${error.message}`);
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Lấy danh sách voucher khả dụng
  // ────────────────────────────────────────────────────────────────────────────────
  async getAvailableCoupons(courseIdsStr: string, userId: number) {
    if (!courseIdsStr) return [];

    const courseIds = courseIdsStr
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    if (courseIds.length === 0) return [];

    const coupons = await this.dataSource.query(
      `SELECT MaCoupon, MaCode, GiaTriGiam, LoaiGiam, MaKH, SoLuongGioiHan, SoLuongDaDung, TrangThai, NgayBatDau, NgayKetThuc, GhiChu, LoaiKM 
       FROM MaGiamGia 
       WHERE TrangThai = 'ACTIVE' 
         AND (NgayBatDau IS NULL OR NgayBatDau <= NOW())
         AND (NgayKetThuc IS NULL OR NgayKetThuc >= NOW())
         AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)`,
    );

    const validatedCoupons = await Promise.all(
      coupons.map(async (coupon: any) => {
        try {
          const validated = await this.couponsService.validateCoupon(
            { maCode: coupon.MaCode, courseIds },
            userId,
          );

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
            isAvailable: true,
            reason: undefined,
            calculatedDiscount: validated.discountAmount,
          };
        } catch (error) {
          return null;
        }
      }),
    );

    return validatedCoupons.filter((coupon): coupon is NonNullable<typeof coupon> =>
      Boolean(coupon?.isAvailable),
    );
    if (false) {

    // Kiểm tra xem user đã từng mua khóa học nào thành công chưa
    const paidInvoices = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM HoaDon WHERE MaND = ? AND TrangThaiThanhToan = 'PAID'`,
      [userId],
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

    const userContext = await this.getUserCouponContext(userId);

    const redeemedCouponIds = new Set<number>();
    if (userId) {
      const redemptionRows = await this.dataSource.query(
        `SELECT MaCoupon FROM LichSuSuDungMaGiamGia WHERE MaND = ?`,
        [userId],
      );
      redemptionRows.forEach((row: any) =>
        redeemedCouponIds.add(Number(row.MaCoupon)),
      );
    }

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

    // Lấy giá các khóa học trong giỏ để tính discountAmount chính xác
    let coursePrices: any[] = [];
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      coursePrices = await this.dataSource.query(
        `SELECT MaKH, GiaBan FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
        courseIds,
      );
    }

    const priceMap = new Map<number, number>();
    coursePrices.forEach((c) => priceMap.set(Number(c.MaKH), Number(c.GiaBan)));

    let totalCartPrice = 0;
    courseIds.forEach((id) => (totalCartPrice += priceMap.get(id) || 0));

    let totalCrossSellPrice = 0;
    const validCartCourseIds = courseIds.filter((id) =>
      validCrossSellCourseIds.includes(Number(id)),
    );
    validCartCourseIds.forEach(
      (id) => (totalCrossSellPrice += priceMap.get(id) || 0),
    );

    return coupons
      .map(async (coupon: any) => {
        if (redeemedCouponIds.has(Number(coupon.MaCoupon))) {
          return null;
        }

        let isAvailable = true;
        let reason: string | undefined = undefined;
        let applicablePrice = 0;
        const ruleRows = await this.dataSource.query(
          `SELECT MaDK, LoaiDieuKien, GiaTriDieuKien
           FROM MaGiamGiaDieuKien
           WHERE MaCoupon = ?
           ORDER BY MaDK ASC`,
          [coupon.MaCoupon],
        );

        if (coupon.LoaiKM === 'CROSS_SELL') {
          if (validCartCourseIds.length === 0) {
            isAvailable = false;
            reason =
              'Mã ưu đãi đã hết hạn (quá 30 phút) hoặc không áp dụng cho khóa học trong giỏ';
            applicablePrice = totalCartPrice; // Just fallback
          } else {
            isAvailable = true;
            applicablePrice = totalCrossSellPrice;
          }
        } else {
          isAvailable =
            coupon.MaKH === null || courseIds.includes(Number(coupon.MaKH));
          reason = isAvailable
            ? undefined
            : 'Mã không áp dụng cho khóa học trong giỏ hàng';
          applicablePrice =
            coupon.MaKH === null
              ? totalCartPrice
              : priceMap.get(Number(coupon.MaKH)) || 0;
        }

        if (isAvailable && coupon.LoaiKM === 'FIRST_TIME' && hasPurchased) {
          isAvailable = false;
          reason = 'Mã chỉ áp dụng cho lần đầu mua khóa học';
        }

        if (isAvailable && ruleRows.length > 0) {
          for (const rule of ruleRows) {
            const ruleType = String(rule.LoaiDieuKien || '').toUpperCase();
            const ruleValue =
              rule.GiaTriDieuKien === null ? null : Number(rule.GiaTriDieuKien);
            const accountAgeHours = userContext.ngayTao
              ? (Date.now() - userContext.ngayTao.getTime()) / (1000 * 60 * 60)
              : null;

            if (
              ['FIRST_PURCHASE', 'NEW_USER_ONLY'].includes(ruleType) &&
              userContext.paidInvoiceCount > 0
            ) {
              isAvailable = false;
              reason = 'MÃ£ chá»‰ Ã¡p dá»¥ng cho khÃ¡ch hÃ ng mua láº§n Ä‘áº§u';
              break;
            }

            if (ruleType === 'REPEAT_PURCHASE' && userContext.paidInvoiceCount === 0) {
              isAvailable = false;
              reason = 'MÃ£ chá»‰ Ã¡p dá»¥ng cho khÃ¡ch hÃ ng Ä‘Ã£ mua trÆ°á»›c Ä‘Ã³';
              break;
            }

            if (
              ruleType === 'NEW_USER_24H' &&
              accountAgeHours !== null &&
              accountAgeHours > 24
            ) {
              isAvailable = false;
              reason = 'MÃ£ chá»‰ Ã¡p dá»¥ng cho tÃ i khoáº£n má»›i trong 24 giá» Ä‘áº§u';
              break;
            }

            if (
              ruleType === 'ACCOUNT_AGE_HOURS' &&
              accountAgeHours !== null &&
              accountAgeHours >
                (Number.isFinite(ruleValue) && ruleValue !== null ? ruleValue : 24)
            ) {
              isAvailable = false;
              reason = 'TÃ i khoáº£n khÃ´ng thá»a Ä‘iá»u kiá»‡n thá»i gian táº¡o';
              break;
            }

            if (
              ruleType === 'COMBO_ONLY' &&
              courseIds.length <
                (Number.isFinite(ruleValue) && ruleValue !== null ? ruleValue : 2)
            ) {
              isAvailable = false;
              reason = 'MÃ£ giáº£m giÃ¡ nÃ y chá»‰ Ã¡p dá»¥ng khi mua combo Ä‘á»§ sá»‘ lÆ°á»£ng khÃ³a há»c yÃªu cáº§u';
              break;
            }

            if (
              ruleType === 'MIN_ORDER_VALUE' &&
              applicablePrice <
                (Number.isFinite(ruleValue) && ruleValue !== null ? ruleValue : 0)
            ) {
              isAvailable = false;
              reason = 'GiÃ¡ trá»‹ Ä‘Æ¡n hÃ ng chÆ°a Ä‘áº¡t má»©c tá»‘i thiá»ƒu Ä‘á»ƒ Ã¡p dá»¥ng mÃ£ giáº£m giÃ¡';
              break;
            }

            if (
              ruleType === 'MIN_COURSE_COUNT' &&
              courseIds.length <
                (Number.isFinite(ruleValue) && ruleValue !== null ? ruleValue : 1)
            ) {
              isAvailable = false;
              reason = 'Sá»‘ lÆ°á»£ng khÃ³a há»c trong giá» chÆ°a Ä‘áº¡t má»©c tá»‘i thiá»ƒu Ä‘á»ƒ Ã¡p dá»¥ng mÃ£ giáº£m giÃ¡';
              break;
            }
          }
        }

        let calculatedDiscount = 0;
        if (isAvailable) {
          if (coupon.LoaiGiam === 'PERCENT') {
            calculatedDiscount =
              (applicablePrice * Number(coupon.GiaTriGiam)) / 100;
          } else {
            calculatedDiscount = Math.min(
              Number(coupon.GiaTriGiam),
              applicablePrice,
            );
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
      })
      .filter((coupon): coupon is NonNullable<typeof coupon> => {
        return Boolean(coupon?.isAvailable);
      });
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // Lấy chi tiết hoá đơn
  // ────────────────────────────────────────────────────────────────────────────────
  async getInvoiceDetails(invoiceId: number, userId: number) {
    try {
      const invoice = await this.dataSource.query(
        `SELECT MaHD, TongTien, TrangThaiThanhToan FROM HoaDon WHERE MaHD = ? AND MaND = ?`,
        [invoiceId, userId],
      );

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
