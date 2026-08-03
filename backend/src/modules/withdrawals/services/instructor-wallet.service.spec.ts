import { InstructorWalletService } from './instructor-wallet.service';

describe('InstructorWalletService', () => {
  const createQueryRunner = () => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  });

  it('credits each paid invoice course into the instructor wallet once', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.query
      .mockResolvedValueOnce([
        { courseId: 17, instructorId: 42, amount: '800000.00' },
      ])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([
        {
          maVi: 7,
          maND: 42,
          soDuKhaDung: '100000.00',
          soDuDangRut: '0.00',
          tongDoanhThu: '100000.00',
          tongDaChi: '0.00',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const service = new InstructorWalletService({
      createQueryRunner: jest.fn(() => queryRunner),
      query: jest.fn(),
    } as any);

    await service.creditPaidInvoice(99);

    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE ViGiangVien'),
      [800000, 800000, 42],
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO LichSuGiaoDichViGiangVien'),
      expect.arrayContaining([
        7,
        42,
        800000,
        100000,
        900000,
        'invoice:99:course:17:revenue',
      ]),
    );
  });

  it('does not credit an invoice course when its idempotency history already exists', async () => {
    const queryRunner = createQueryRunner();
    queryRunner.query
      .mockResolvedValueOnce([
        { courseId: 17, instructorId: 42, amount: '800000.00' },
      ])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([
        {
          maVi: 7,
          maND: 42,
          soDuKhaDung: '100000.00',
          soDuDangRut: '0.00',
          tongDoanhThu: '100000.00',
          tongDaChi: '0.00',
        },
      ])
      .mockResolvedValueOnce([{ maLichSu: '15' }]);

    const service = new InstructorWalletService({
      createQueryRunner: jest.fn(() => queryRunner),
      query: jest.fn(),
    } as any);

    await service.creditPaidInvoice(99);

    expect(queryRunner.query).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE ViGiangVien'),
      expect.anything(),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });
});
