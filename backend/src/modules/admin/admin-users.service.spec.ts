import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new AdminUsersService(dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
  });

  it('returns filtered users with dashboard summary', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 12,
          fullName: 'Le Thi A',
          email: 'a@example.com',
          phone: '0912345678',
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          avatar: 'https://example.com/avatar.png',
          createdAt: '2026-06-01 10:00:00',
          activeEnrollments: '8',
          purchaseCount: '6',
          totalSpent: '1250000',
        },
      ])
      .mockResolvedValueOnce([
        {
          totalUsers: '20',
          activeUsers: '18',
          inactiveUsers: '1',
          deletedUsers: '1',
          admins: '2',
          instructors: '5',
          students: '13',
        },
      ]);

    await expect(
      service.getUsers({ search: 'le thi', role: 'instructor', status: 'active' }),
    ).resolves.toEqual({
      message: 'Lấy danh sách người dùng thành công.',
      data: [
        {
          id: 12,
          fullName: 'Le Thi A',
          email: 'a@example.com',
          phone: '0912345678',
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          avatar: 'https://example.com/avatar.png',
          createdAt: '2026-06-01T03:00:00.000Z',
          activeEnrollments: 8,
          purchaseCount: 6,
          totalSpent: 1250000,
        },
      ],
      summary: {
        totalUsers: 20,
        activeUsers: 18,
        inactiveUsers: 1,
        deletedUsers: 1,
        admins: 2,
        instructors: 5,
        students: 13,
      },
    });

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('nd.HoTen LIKE ?'),
      ['%le thi%', '%le thi%', '%le thi%', 'INSTRUCTOR', 'ACTIVE'],
    );
  });

  it('updates user status and returns the next state', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaND: 7 }])
      .mockResolvedValueOnce([]);

    await expect(service.updateUserStatus(7, 'inactive')).resolves.toEqual({
      message: 'Cập nhật trạng thái người dùng thành công.',
      data: {
        id: 7,
        status: 'INACTIVE',
      },
    });
  });

  it('updates user role and rejects invalid ids for bulk updates', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaND: 9 }])
      .mockResolvedValueOnce([]);

    await expect(service.updateUserRole(9, 'student')).resolves.toEqual({
      message: 'Cập nhật vai trò người dùng thành công.',
      data: {
        id: 9,
        role: 'STUDENT',
      },
    });

    await expect(service.bulkUpdateStatus([], 'ACTIVE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when target user does not exist', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.updateUserStatus(999, 'ACTIVE')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
