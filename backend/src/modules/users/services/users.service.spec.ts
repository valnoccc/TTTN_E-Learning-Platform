import { UsersService } from './users.service';

describe('UsersService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const userRepository = {
    find: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const service = new UsersService(userRepository as never, dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
  });

  it('normalizes payment history statuses including legacy CANCELLED spelling', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        id: 21,
        date: '2026-07-01 10:15:00',
        amount: '650000',
        status: 'CANCELLED',
      },
      {
        id: 22,
        date: '2026-07-01 11:30:00',
        amount: '550000',
        status: 'CANCELED',
      },
      {
        id: 23,
        date: '2026-07-01 12:45:00',
        amount: '500000',
        status: 'FAILED',
      },
    ]);

    await expect(service.getMyPayments(7)).resolves.toEqual([
      {
        id: 'INV-21',
        MaHD: 21,
        date: '2026-07-01',
        amount: 650000,
        status: 'Failed',
      },
      {
        id: 'INV-22',
        MaHD: 22,
        date: '2026-07-01',
        amount: 550000,
        status: 'Failed',
      },
      {
        id: 'INV-23',
        MaHD: 23,
        date: '2026-07-01',
        amount: 500000,
        status: 'Failed',
      },
    ]);
  });
});
