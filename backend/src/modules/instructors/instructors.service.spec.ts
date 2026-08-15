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

  const profileDetailsService = {
    replaceDetails: jest.fn(),
    getDetails: jest.fn().mockResolvedValue({ qualifications: [], experiences: [] }),
  };

  const service = new InstructorsService(
    dataSource as never,
    userRepo as never,
    hoSoRepo as never,
    cloudinaryService,
    profileDetailsService as never,
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

  it('returns only this instructor transaction lines from a mixed-instructor invoice', async () => {
    dataSource.query.mockResolvedValue([
      {
        invoiceId: 1001,
        studentId: 11,
        studentName: 'Nguyen Van A',
        studentEmail: 'a@example.com',
        courseId: 101,
        courseName: 'React Co Ban',
        transactionAmount: '600000.00',
        instructorAmount: '480000.00',
        paymentMethod: 'VNPAY',
        purchasedAt: '2026-05-01 10:00:00',
        paymentStatus: 'PAID',
      },
    ]);

    const result = await service.getMyTransactions(
      { maND: 7, vaiTro: UserRole.INSTRUCTOR },
      {},
    );

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('kh.MaND_GiangVien = ?'),
      [7],
    );
    expect(result).toMatchObject({
      totalTransactions: 1,
      totalGrossRevenue: 600000,
      totalInstructorRevenue: 480000,
    });
    expect(result.transactions[0]).toMatchObject({
      invoiceId: 1001,
      courseId: 101,
      transactionAmount: 600000,
      instructorAmount: 480000,
    });
  });

  it('rejects non instructor users', async () => {
    await expect(
      service.getMyTransactions({ maND: 1, vaiTro: UserRole.STUDENT }, {}),
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

  it('returns public instructor details with aggregated course stats', async () => {
    userRepo.findOne.mockResolvedValue({
      maND: 7,
      hoTen: 'Nguyen Van A',
      anhDaiDien: 'avatar.png',
      email: 'teacher@example.com',
      vaiTro: UserRole.INSTRUCTOR,
    });
    hoSoRepo.findOne.mockResolvedValue({
      MaND: 7,
      ChuyenMon: 'NestJS',
      TieuSu: 'Giang vien kinh nghiem',
      FacebookURL: 'https://facebook.com/teacher',
    });
    dataSource.query.mockResolvedValue([
      {
        id: 101,
        courseTitle: 'NestJS Co Ban',
        price: '250000.00',
        imgUrl: 'course-1.jpg',
        courseDesc: 'Khoa hoc ve NestJS',
        totalDurationSeconds: '5400',
        lessonCount: '12',
        averageRating: '4.7',
        reviewCount: '8',
        views: '34',
      },
    ]);

    const result = await service.getPublicInstructorById(7);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { maND: 7, vaiTro: UserRole.INSTRUCTOR },
    });
    expect(result).toMatchObject({
      id: 7,
      personName: 'Nguyen Van A',
      personImage: 'avatar.png',
      personTitle: 'NestJS',
      email: 'teacher@example.com',
      bio: 'Giang vien kinh nghiem',
      courses: [
        {
          id: 101,
          courseTitle: 'NestJS Co Ban',
          price: 250000,
          imgUrl: 'course-1.jpg',
          totalDurationSeconds: 5400,
          lessonCount: 12,
          averageRating: 4.7,
          reviewCount: 8,
          views: 34,
        },
      ],
    });
  });
});
