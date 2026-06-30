import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { Coupon } from './entities/coupon.entity';
import { CouponsService } from './services/coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let dataSource: { query: jest.Mock; createQueryRunner: jest.Mock };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    query: jest.Mock;
  };
  let couponRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let courseRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
    };

    dataSource = {
      query: jest.fn(),
      createQueryRunner: jest.fn(() => queryRunner),
    };

    couponRepository = {
      findOne: jest.fn(),
      create: jest.fn((payload: Partial<Coupon>) => payload),
      save: jest.fn((payload: Partial<Coupon>) =>
        Promise.resolve({ maCoupon: 1, ...payload }),
      ),
    };

    courseRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Coupon), useValue: couponRepository },
        { provide: getRepositoryToken(KhoaHoc), useValue: courseRepository },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('stores admin coupon scope and conditions in dedicated tables', async () => {
    queryRunner.query
      .mockResolvedValueOnce({ insertId: 120009 })
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ affectedRows: 1 });

    const result = await service.createAdminCoupon(1, {
      maCode: '8MARCH-2026',
      giaTriGiam: 20,
      loaiGiam: 'PERCENT',
      loaiKM: 'HOLIDAY',
      scopeType: 'COURSE',
      scopeTargetIds: [101, 102],
      rules: [
        {
          loaiDieuKien: 'MIN_ORDER_VALUE',
          giaTriDieuKien: 500000,
          moTa: 'Chỉ áp dụng cho đơn từ 500k',
        },
        {
          loaiDieuKien: 'FIRST_PURCHASE',
        },
      ],
      ghiChu: 'Chiến dịch 8/3',
    });

    expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO MaGiamGia'),
      expect.arrayContaining(['8MARCH-2026', 20, 'PERCENT', 'ACTIVE']),
    );
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO MaGiamGiaPhamVi'),
      expect.arrayContaining([120009, 'COURSE', 101]),
    );
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO MaGiamGiaPhamVi'),
      expect.arrayContaining([120009, 'COURSE', 102]),
    );
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO MaGiamGiaDieuKien'),
      expect.arrayContaining([120009, 'MIN_ORDER_VALUE', 500000]),
    );
    expect(queryRunner.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO MaGiamGiaDieuKien'),
      expect.arrayContaining([120009, 'FIRST_PURCHASE', null]),
    );
    expect(result).toEqual({
      couponId: 120009,
      maCode: '8MARCH-2026',
    });
  });

  it('rejects percent coupons above 99', async () => {
    await expect(
      service.createCoupon(10, {
        maCode: 'BIG100',
        giaTriGiam: 100,
        loaiGiam: 'PERCENT',
        maKH: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects coupon creation for a course the instructor does not own', async () => {
    couponRepository.findOne.mockResolvedValue(null);
    courseRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createCoupon(99, {
        maCode: 'PRIVATE50',
        giaTriGiam: 50,
        loaiGiam: 'PERCENT',
        maKH: 8,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects inactive coupons during checkout validation', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        maCoupon: 1,
        maCode: 'OFF50',
        giaTriGiam: 50,
        loaiGiam: 'PERCENT',
        trangThai: 'INACTIVE',
        ngayBatDau: null,
        ngayKetThuc: null,
        maKH: 10,
        soLuongGioiHan: null,
        soLuongDaDung: 0,
        tenKhoaHoc: 'React',
        giaBan: 300000,
      },
    ]);

    await expect(
      service.validateCoupon({ maCode: 'OFF50', courseIds: [10, 11] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when a coupon code does not exist', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(
      service.validateCoupon({ maCode: 'MISSING', courseIds: [10] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies a coupon only to the matching course in a multi-course cart', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        maCoupon: 2,
        maCode: 'REACT10',
        giaTriGiam: 10,
        loaiGiam: 'PERCENT',
        trangThai: 'ACTIVE',
        ngayBatDau: null,
        ngayKetThuc: null,
        maKH: 10,
        soLuongGioiHan: null,
        soLuongDaDung: 0,
        tenKhoaHoc: 'React',
        giaBan: 300000,
      },
    ]);
    dataSource.query.mockResolvedValueOnce([]);
    dataSource.query.mockResolvedValueOnce([]);
    dataSource.query.mockResolvedValueOnce([{ TotalPrice: 300000 }]);

    const result = await service.validateCoupon({
      maCode: 'REACT10',
      courseIds: [12, 10, 99],
    });

    expect(result.matchedCourseId).toBe(10);
    expect(result.discountAmount).toBe(30000);
  });

  it('rejects admin coupons when the cart does not satisfy their conditions', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        maCoupon: 8,
        maCode: 'SALE8',
        giaTriGiam: 50,
        loaiGiam: 'PERCENT',
        trangThai: 'ACTIVE',
        ngayBatDau: null,
        ngayKetThuc: null,
        maKH: null,
        soLuongGioiHan: null,
        soLuongDaDung: 0,
        tenKhoaHoc: 'React',
        giaBan: 300000,
        loaiKM: 'STANDARD',
      },
    ]);
    dataSource.query.mockResolvedValueOnce([
      {
        maPV: 1,
        maCoupon: 8,
        loaiPhamVi: 'COURSE',
        maDoiTuong: 10,
      },
    ]);
    dataSource.query.mockResolvedValueOnce([
      {
        maDK: 1,
        maCoupon: 8,
        loaiDieuKien: 'MIN_ORDER_VALUE',
        giaTriDieuKien: 500000,
        moTa: 'Đơn tối thiểu 500k',
      },
    ]);
    dataSource.query.mockResolvedValueOnce([{ TotalPrice: 300000 }]);

    await expect(
      service.validateCoupon({ maCode: 'SALE8', courseIds: [10] }, 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('caps amount discount at the matching course subtotal', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        maCoupon: 3,
        maCode: 'FREE999',
        giaTriGiam: 999999,
        loaiGiam: 'AMOUNT',
        trangThai: 'ACTIVE',
        ngayBatDau: null,
        ngayKetThuc: null,
        maKH: 5,
        soLuongGioiHan: null,
        soLuongDaDung: 0,
        tenKhoaHoc: 'NestJS',
        giaBan: 250000,
      },
    ]);
    dataSource.query.mockResolvedValueOnce([]);
    dataSource.query.mockResolvedValueOnce([]);
    dataSource.query.mockResolvedValueOnce([{ TotalPrice: 250000 }]);

    const result = await service.validateCoupon({
      maCode: 'FREE999',
      courseIds: [5],
    });

    expect(result.discountAmount).toBe(250000);
  });

  it('increments usage only when consumeCouponUsage is called', async () => {
    dataSource.query.mockResolvedValueOnce({
      affectedRows: 1,
    });

    const result = await service.consumeCouponUsage(7);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('SET SoLuongDaDung = SoLuongDaDung + 1'),
      [7],
    );
    expect(result).toEqual({
      success: true,
      couponId: 7,
    });
  });

  it('records coupon redemption history when coupon usage is logged', async () => {
    const historyRunner = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce({ affectedRows: 1 }),
    };

    await service.recordCouponRedemption(
      {
        couponId: 7,
        userId: 88,
        invoiceId: 123,
        discountAmount: 45000,
        orderValue: 300000,
      },
      historyRunner,
    );

    expect(historyRunner.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE MaGiamGia'),
      [7],
    );
    expect(historyRunner.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO LichSuSuDungMaGiamGia'),
      [7, 88, 123, 300000, 45000],
    );
  });
});
