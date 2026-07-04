import { CheckoutService } from './checkout.service';
import * as crypto from 'crypto';
import axios from 'axios';

describe('CheckoutService', () => {
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    query: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };

  const dataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
    query: jest.fn(),
  };

  const notificationsService = {
    createNotification: jest.fn(),
  };

  const couponsService = {
    validateCoupon: jest.fn(),
    recordCouponRedemption: jest.fn(),
  };

  const service = new CheckoutService(
    dataSource as never,
    notificationsService as never,
    couponsService as never,
  );

  const signMomoBody = (body: Record<string, any>) => {
    const rawSignature =
      `accessKey=${process.env.MOMO_ACCESS_KEY}` +
      `&amount=${body.amount}` +
      `&extraData=${body.extraData}` +
      `&message=${body.message}` +
      `&orderId=${body.orderId}` +
      `&orderInfo=${body.orderInfo}` +
      `&orderType=${body.orderType}` +
      `&partnerCode=${body.partnerCode}` +
      `&payType=${body.payType}` +
      `&requestId=${body.requestId}` +
      `&responseTime=${body.responseTime}` +
      `&resultCode=${body.resultCode}` +
      `&transId=${body.transId}`;

    return crypto
      .createHmac('sha256', process.env.MOMO_SECRET_KEY || '')
      .update(rawSignature)
      .digest('hex');
  };

  const createMomoBody = (
    resultCode: string | number,
    extra: Record<string, any> = {
      invoiceId: 99,
      userId: 7,
      courseIds: [101],
      appliedCouponId: null,
    },
  ) => {
    const body = {
      partnerCode: 'MOMO',
      orderId: 'ORDER-99',
      requestId: 'REQ-99',
      amount: '100000',
      orderInfo: 'Thanh toan khoa hoc',
      orderType: 'momo_wallet',
      transId: '123456',
      resultCode,
      message:
        resultCode === '0' || resultCode === 0 ? 'Successful.' : 'Card failed.',
      payType: 'atm',
      responseTime: '1700000000000',
      extraData: Buffer.from(JSON.stringify(extra)).toString('base64'),
    };

    return {
      ...body,
      signature: signMomoBody(body),
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    dataSource.createQueryRunner.mockImplementation(() => queryRunner);
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        resultCode: 0,
        payUrl: 'https://test-payment.momo.vn/mock',
      },
    } as any);
    process.env.MOMO_ACCESS_KEY = 'test-access-key';
    process.env.MOMO_PARTNER_CODE = 'MOMO';
    process.env.MOMO_SECRET_KEY = 'test-secret-key';
    process.env.MOMO_NOTIFY_URL = 'https://example.com/checkout/momo-ipn';
    queryRunner.connect.mockResolvedValue(undefined);
    queryRunner.startTransaction.mockResolvedValue(undefined);
    queryRunner.commitTransaction.mockResolvedValue(undefined);
    queryRunner.rollbackTransaction.mockResolvedValue(undefined);
    queryRunner.release.mockResolvedValue(undefined);
    notificationsService.createNotification.mockResolvedValue(undefined);
    dataSource.query.mockResolvedValue([]);
  });

  it('stores instructor revenue at 80 percent for direct payments', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          MaKH: 101,
          GiaBan: '100000',
          TenKhoaHoc: 'React Co Ban',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await service.processPayment(
      {
        courseIds: [101],
        paymentMethod: 'BANK',
        customerDetails: {
          fullName: 'Nguyen Van A',
          email: 'a@example.com',
          phone: '0900000000',
        },
      },
      7,
    );

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ChiTietHoaDon'),
      [55, 101, 100000, 80, 80000],
    );
  });

  it('does not consume coupon usage when creating a pending MoMo payment', async () => {
    couponsService.validateCoupon.mockResolvedValueOnce({
      couponId: 12,
      discountAmount: 50000,
      targetCourseIds: [101],
    });

    queryRunner.query
      .mockResolvedValueOnce([
        {
          MaKH: 101,
          GiaBan: '100000',
          TenKhoaHoc: 'React Co Ban',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await service.createMomoPayment(7, {
      courseIds: [101],
      couponCode: 'OFF50',
      customerDetails: {
        fullName: 'Nguyen Van A',
        email: 'a@example.com',
        phone: '0900000000',
      },
    });

    expect(couponsService.recordCouponRedemption).not.toHaveBeenCalled();
  });

  it('treats MoMo string resultCode zero as successful and enrolls the student', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          MaHD: 99,
          TrangThaiThanhToan: 'PENDING',
        },
      ])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({});
    dataSource.query.mockResolvedValueOnce([{ TenKhoaHoc: 'React Co Ban' }]);

    await service.handleMomoIPN(createMomoBody('0'));

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE HoaDon SET TrangThaiThanhToan = 'PAID'"),
      [99],
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO DangKyKhoaHoc'),
      [7, 101, 99, 'ACTIVE'],
    );
  });

  it('records coupon redemption history for successful MoMo payments', async () => {
    queryRunner.query
      .mockResolvedValueOnce([
        {
          MaHD: 99,
          TrangThaiThanhToan: 'PENDING',
        },
      ])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([{ TongTien: 250000 }])
      .mockResolvedValueOnce([{ totalOrderValue: 300000 }]);
    dataSource.query.mockResolvedValueOnce([{ TenKhoaHoc: 'React Co Ban' }]);

    await service.handleMomoIPN(
      createMomoBody('0', {
        invoiceId: 99,
        userId: 7,
        courseIds: [101],
        appliedCouponId: 12,
      }),
    );

    expect(couponsService.recordCouponRedemption).toHaveBeenCalledWith(
      {
        couponId: 12,
        userId: 7,
        invoiceId: 99,
        discountAmount: 50000,
        orderValue: 300000,
      },
      queryRunner,
    );
  });

  it('returns only coupons that are valid for the current account', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        MaCoupon: 1,
        MaCode: 'VALID10',
        GiaTriGiam: 10,
        LoaiGiam: 'PERCENT',
        MaKH: null,
        SoLuongGioiHan: null,
        SoLuongDaDung: 0,
        TrangThai: 'ACTIVE',
        NgayBatDau: null,
        NgayKetThuc: null,
        GhiChu: null,
        LoaiKM: 'STANDARD',
      },
      {
        MaCoupon: 2,
        MaCode: 'NEWBIE306',
        GiaTriGiam: 25,
        LoaiGiam: 'PERCENT',
        MaKH: null,
        SoLuongGioiHan: null,
        SoLuongDaDung: 0,
        TrangThai: 'ACTIVE',
        NgayBatDau: null,
        NgayKetThuc: null,
        GhiChu: 'Mã giảm giá cho tài khoản mới tạo trong 24h đầu tiên',
        LoaiKM: 'STANDARD',
      },
    ]);
    couponsService.validateCoupon
      .mockResolvedValueOnce({
        discountAmount: 10000,
        targetCourseIds: [101],
      })
      .mockRejectedValueOnce(new Error('Mã chỉ áp dụng cho tài khoản mới trong 24 giờ đầu'));

    const result = await service.getAvailableCoupons('101', 7);

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('VALID10');
    expect(couponsService.validateCoupon).toHaveBeenNthCalledWith(
      1,
      { maCode: 'VALID10', courseIds: [101] },
      7,
    );
    expect(couponsService.validateCoupon).toHaveBeenNthCalledWith(
      2,
      { maCode: 'NEWBIE306', courseIds: [101] },
      7,
    );
  });

  it('skips duplicate MoMo IPN processing when the invoice was already handled', async () => {
    queryRunner.query.mockResolvedValueOnce([
      {
        MaHD: 99,
        TrangThaiThanhToan: 'PENDING',
      },
    ]);
    queryRunner.query.mockResolvedValueOnce({ affectedRows: 0 });

    const result = await service.handleMomoIPN(createMomoBody('0'));

    expect(queryRunner.query).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO DangKyKhoaHoc'),
      expect.any(Array),
    );
    expect(result).toEqual({ message: 'IPN already processed' });
  });

  it('reconciles failed MoMo return payloads without enrolling the student', async () => {
    const result = await service.handleMomoReturn(createMomoBody('7'), 7);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE HoaDon SET TrangThaiThanhToan = ?'),
      ['FAILED', 99],
    );
    expect(queryRunner.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO DangKyKhoaHoc'),
      expect.any(Array),
    );
    expect(result).toMatchObject({
      invoiceId: 99,
      paymentStatus: 'FAILED',
      resultCode: 7,
    });
  });

  it('treats MoMo cancel-like result codes as failed payments', async () => {
    const result = await service.handleMomoReturn(createMomoBody('1006'), 7);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE HoaDon SET TrangThaiThanhToan = ?'),
      ['FAILED', 99],
    );
    expect(result).toMatchObject({
      invoiceId: 99,
      paymentStatus: 'FAILED',
      resultCode: 1006,
    });
  });

  it('creates a failure notification for a failed MoMo payment and does not send success notifications', async () => {
    dataSource.query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ TenKhoaHoc: 'React Co Ban' }]);

    await service.handleMomoIPN(createMomoBody('7'));

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        loaiThongBao: expect.any(String),
        tieuDe: expect.stringContaining('Thanh toán MoMo thất bại'),
      }),
    );
    expect(notificationsService.createNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({
        tieuDe: expect.stringContaining('Thanh toán MoMo thành công'),
      }),
    );
  });

  it('does not create duplicate failure notifications when the failed invoice was already handled', async () => {
    dataSource.query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ TenKhoaHoc: 'React Co Ban' }])
      .mockResolvedValueOnce({ affectedRows: 0 });

    await service.handleMomoIPN(createMomoBody('7'));
    await service.handleMomoIPN(createMomoBody('7'));

    expect(notificationsService.createNotification).toHaveBeenCalledTimes(1);
  });
});
