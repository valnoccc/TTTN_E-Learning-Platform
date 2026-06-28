import { CheckoutService } from './checkout.service';

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
  };

  const notificationsService = {
    createNotification: jest.fn(),
  };

  const service = new CheckoutService(
    dataSource as never,
    notificationsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryRunner.connect.mockResolvedValue(undefined);
    queryRunner.startTransaction.mockResolvedValue(undefined);
    queryRunner.commitTransaction.mockResolvedValue(undefined);
    queryRunner.rollbackTransaction.mockResolvedValue(undefined);
    queryRunner.release.mockResolvedValue(undefined);
    notificationsService.createNotification.mockResolvedValue(undefined);
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
});
