import { ForbiddenException } from '@nestjs/common';

import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserRole } from '../users/entities/user.entity';
import { InstructorsService } from './services/instructors.service';

describe('InstructorsService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const userRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const hoSoRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const cloudinaryService = {
    extractPublicId: jest.fn(),
    deleteFile: jest.fn(),
    uploadFile: jest.fn(),
  } as unknown as CloudinaryService;

  const service = new InstructorsService(
    dataSource as never,
    userRepo as never,
    hoSoRepo as never,
    cloudinaryService,
  );

  beforeEach(() => {
    dataSource.query.mockReset();
    userRepo.findOne.mockReset();
    userRepo.createQueryBuilder.mockReset();
    hoSoRepo.findOne.mockReset();
    hoSoRepo.find.mockReset();
    hoSoRepo.create.mockReset();
    hoSoRepo.save.mockReset();
  });

  it('returns purchased students by student and course for the instructor', async () => {
    dataSource.query.mockResolvedValue([
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '200000.00',
        purchasedAt: '2026-05-01 10:00:00',
      },
      {
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 102,
        courseName: 'NestJS Co Ban',
        coursePrice: '360000.00',
        purchasedAt: '2026-05-02 12:00:00',
      },
      {
        studentId: 12,
        studentName: 'Tran Thi B',
        studentEmail: 'b@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        coursePrice: '200000.00',
        purchasedAt: '2026-05-03 08:00:00',
      },
    ]);

    const result = await service.getMyStudents(
      { maND: 7, vaiTro: UserRole.INSTRUCTOR },
      {},
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('dk.MaND'),
      [7],
    );
    expect(result.totalStudents).toBe(2);
    expect(result.totalPurchases).toBe(3);
    expect(result.totalRevenue).toBe(760000);
    expect(result.students[0]).toMatchObject({
      studentId: 11,
      studentName: 'Nguyen Van A',
      courseId: 101,
      courseName: 'React Co Ban',
      totalSpent: 200000,
    });
  });

  it('applies course and search filters when listing students', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.getMyStudents(
      { maND: 9, vaiTro: UserRole.INSTRUCTOR },
      { courseId: 77, search: 'lan' },
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.MaKH = ?'),
      [9, 77, '%lan%', '%lan%'],
    );
  });

  it('uses JWT subject as instructor id when listing students', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.getMyStudents({ sub: 5, vaiTro: UserRole.INSTRUCTOR }, {});

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.MaND_GiangVien = ?'),
      [5],
    );
  });

  it('rejects non instructor users', async () => {
    await expect(
      service.getMyStudents({ maND: 1, vaiTro: UserRole.STUDENT }, {}),
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

    const result = await service.getMyCourses({
      maND: 7,
      vaiTro: UserRole.INSTRUCTOR,
    });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM KhoaHoc'),
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
