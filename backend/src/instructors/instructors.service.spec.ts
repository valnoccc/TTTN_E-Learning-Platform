import { ForbiddenException } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { UserRole } from '../users/entities/user.entity';

describe('InstructorsService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new InstructorsService(dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
  });

  it('groups purchased students by student and course for the instructor', async () => {
    dataSource.query.mockResolvedValue([
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '250000.00',
        purchasedAt: '2026-05-01 10:00:00',
      },
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 102,
        courseName: 'NestJS Co Ban',
        coursePrice: '450000.00',
        purchasedAt: '2026-05-02 12:00:00',
      },
      {
        studentId: 12,
        studentName: 'Tran Thi B',
        studentEmail: 'b@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '250000.00',
        purchasedAt: '2026-05-03 08:00:00',
      },
    ]);

    const result = await service.getMyStudents(
      { id: 7, role: UserRole.INSTRUCTOR },
      {},
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('hd.id_hoc_vien'),
      [7],
    );
    expect(result.totalStudents).toBe(2);
    expect(result.totalPurchases).toBe(3);
    expect(result.totalRevenue).toBe(950000);
    expect(result.students[0]).toMatchObject({
      studentId: 12,
      studentName: 'Tran Thi B',
      totalCourses: 1,
      totalSpent: 250000,
    });
    expect(result.students[0].courses).toHaveLength(1);
    expect(result.students[1]).toMatchObject({
      studentId: 11,
      studentName: 'Nguyen Van A',
      totalCourses: 2,
      totalSpent: 700000,
    });
    expect(result.students[1].courses).toHaveLength(2);
  });

  it('applies course and search filters when listing students', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.getMyStudents(
      { id: 9, role: UserRole.INSTRUCTOR },
      { courseId: 77, search: 'lan' },
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.id = ?'),
      [9, 77, '%lan%', '%lan%'],
    );
  });

  it('uses JWT subject as instructor id when listing students', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.getMyStudents(
      { sub: 5, role: UserRole.INSTRUCTOR } as never,
      {},
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.id_giang_vien = ?'),
      [5],
    );
  });

  it('rejects non instructor users', async () => {
    await expect(
      service.getMyStudents(
        { id: 1, role: UserRole.STUDENT },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns instructor course options', async () => {
    dataSource.query.mockResolvedValue([
      {
        courseId: 1,
        courseName: 'TypeScript Essentials',
        coursePrice: '300000.00',
        status: 'PUBLISHED',
        createdAt: '2026-04-01 00:00:00',
      },
    ]);

    const result = await service.getMyCourses({ id: 7, role: UserRole.INSTRUCTOR });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM khoahoc'),
      [7],
    );
    expect(result).toEqual([
      {
        courseId: 1,
        courseName: 'TypeScript Essentials',
        coursePrice: 300000,
        status: 'PUBLISHED',
        createdAt: '2026-04-01 00:00:00',
      },
    ]);
  });
});
