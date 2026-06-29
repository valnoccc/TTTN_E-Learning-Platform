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
  let dataSource: { query: jest.Mock };
  let couponRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let courseRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
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
    dataSource.query.mockResolvedValueOnce([
      { MaKH: 12, GiaBan: 200000, TenKhoaHoc: 'NestJS', MaDM: 1, MaND_GiangVien: 99 },
      { MaKH: 10, GiaBan: 300000, TenKhoaHoc: 'React', MaDM: 1, MaND_GiangVien: 99 },
      { MaKH: 99, GiaBan: 150000, TenKhoaHoc: 'Docker', MaDM: 1, MaND_GiangVien: 99 },
    ]);

    const result = await service.validateCoupon({
      maCode: 'REACT10',
      courseIds: [12, 10, 99],
    });

    expect(result.matchedCourseId).toBe(10);
    expect(result.discountAmount).toBe(30000);
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
    dataSource.query.mockResolvedValueOnce([
      { MaKH: 5, GiaBan: 250000, TenKhoaHoc: 'NestJS', MaDM: 1, MaND_GiangVien: 99 },
    ]);

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
});
