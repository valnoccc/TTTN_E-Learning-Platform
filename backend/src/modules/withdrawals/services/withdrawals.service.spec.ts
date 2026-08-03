import { BadRequestException } from '@nestjs/common';

import { WithdrawalsService } from './withdrawals.service';

describe('WithdrawalsService', () => {
  const createQueryRunner = () => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  });

  it('holds available wallet money and snapshots bank data when instructor requests a withdrawal', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.query
      .mockResolvedValueOnce([
        {
          SoTaiKhoan: '0123456789',
          MaNganHang: 'VCB',
          TenNganHang: 'Vietcombank',
          TenChuTaiKhoan: 'NGUYEN VAN A',
        },
      ])
      .mockResolvedValueOnce([
        {
          MaVi: 5,
          SoDuKhaDung: '1000000.00',
          SoDuDangRut: '200000.00',
        },
      ])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ insertId: 9 })
      .mockResolvedValueOnce({});

    const service = new WithdrawalsService(
      { createQueryRunner: jest.fn(() => queryRunner) } as any,
    );

    const result = await service.createRequest(42, { soTien: 500000 });

    expect(result).toMatchObject({
      requestId: 9,
      amount: 500000,
      status: 'PENDING',
    });
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE ViGiangVien'),
      [500000, 500000, 42],
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO LichSuGiaoDichViGiangVien'),
      expect.arrayContaining([
        5,
        42,
        500000,
        1000000,
        500000,
        200000,
        700000,
        'withdrawal:9:hold',
      ]),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an amount greater than the available wallet balance', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.query
      .mockResolvedValueOnce([
        {
          SoTaiKhoan: '0123456789',
          MaNganHang: 'VCB',
          TenNganHang: 'Vietcombank',
          TenChuTaiKhoan: 'NGUYEN VAN A',
        },
      ])
      .mockResolvedValueOnce([
        { MaVi: 5, SoDuKhaDung: '100000.00', SoDuDangRut: '0.00' },
      ]);

    const service = new WithdrawalsService(
      { createQueryRunner: jest.fn(() => queryRunner) } as any,
    );

    await expect(service.createRequest(42, { soTien: 100001 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('paginates withdrawal requests for admin with instructor and payout snapshots', async () => {
    const dataSource = {
      query: jest.fn()
        .mockResolvedValueOnce([{ total: '21' }])
        .mockResolvedValueOnce([{ requestId: '9', amount: '500000', status: 'PENDING', instructorName: 'A' }]),
    };
    const service = new WithdrawalsService(dataSource as any);
    const result = await service.getAdminRequests('PENDING', 2, 20);
    expect(result).toMatchObject({
      items: [{ requestId: 9, amount: 500000, status: 'PENDING', instructorName: 'A' }],
      page: 2,
      limit: 20,
      totalItems: 21,
      totalPages: 2,
    });
    expect(dataSource.query).toHaveBeenLastCalledWith(expect.stringContaining('LIMIT ? OFFSET ?'), ['PENDING', 20, 20]);
  });
});
