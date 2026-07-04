jest.mock('../../lesson-video-storage/lesson-video-storage.service', () => ({
  LessonVideoStorageService: class LessonVideoStorageService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';
import { CourseStudentService } from './course-student.service';

describe('CourseStudentService', () => {
  let service: CourseStudentService;
  let khoaHocRepository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };
  let lessonVideoStorageService: {
    getPlayableUrl: jest.Mock;
  };

  beforeEach(async () => {
    khoaHocRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };
    lessonVideoStorageService = {
      getPlayableUrl: jest.fn(async (url) => url),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseStudentService,
        { provide: getRepositoryToken(KhoaHoc), useValue: khoaHocRepository },
        { provide: DataSource, useValue: dataSource },
        {
          provide: LessonVideoStorageService,
          useValue: lessonVideoStorageService,
        },
      ],
    }).compile();

    service = module.get<CourseStudentService>(CourseStudentService);
  });

  it('builds the public course list with search, category, and price filters', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [
          {
            maKH: 11,
            tenKhoaHoc: 'React Co Ban',
            giaBan: 0,
          },
        ],
        raw: [
          {
            averageRating: '4.6',
            totalLessons: '12',
          },
        ],
      }),
    };
    khoaHocRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(
      service.getAllPublishedCourses({
        search: 'react',
        categoryId: '4',
        price: 'free',
      }),
    ).resolves.toEqual([
      {
        maKH: 11,
        tenKhoaHoc: 'React Co Ban',
        giaBan: 0,
        averageRating: '4.6',
        totalLessons: 12,
      },
    ]);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(khoaHoc.tenKhoaHoc)'),
      { search: '%react%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'khoaHoc.maDM = :categoryId',
      { categoryId: 4 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('khoaHoc.giaBan = 0');
  });

  it('returns a published course detail with instructor, curriculum, and stats', async () => {
    khoaHocRepository.findOne.mockResolvedValue({
      maKH: 11,
      tenKhoaHoc: 'React Co Ban',
      moTa: 'Mo ta',
      giaBan: 399000,
      trangThai: 'PUBLISHED',
      hinhThuNho: 'https://example.com/course.png',
      maDM: 4,
      giangVien: {
        maND: 7,
        hoTen: 'Tran Van B',
        anhDaiDien: 'https://example.com/avatar.png',
      },
      baiHocs: [
        {
          maBH: 10,
          videoURL: 'https://example.com/video.mp4',
        },
      ],
    });
    dataSource.query
      .mockResolvedValueOnce([{ NoiDung: 'Nham vung React co ban' }])
      .mockResolvedValueOnce([{ NoiDung: 'Biet JavaScript co ban' }])
      .mockResolvedValueOnce([{ ChuyenMon: 'Frontend', TieuSu: 'Giang vien' }])
      .mockResolvedValueOnce([
        {
          totalCourses: '5',
          totalStudents: '120',
          courseTotalStudents: '30',
        },
      ]);

    await expect(service.getPublishedCourseById(11)).resolves.toEqual(
      expect.objectContaining({
        maKH: 11,
        giangVien: expect.objectContaining({
          maND: 7,
          tenGiangVien: 'Tran Van B',
          avatar: 'https://example.com/avatar.png',
          chuyenMon: 'Frontend',
          tieuSu: 'Giang vien',
          totalCourses: 5,
          totalStudents: 120,
        }),
        totalStudents: 30,
        muc_tieu: ['Nham vung React co ban'],
        yeu_cau: ['Biet JavaScript co ban'],
        baiHocs: [
          expect.objectContaining({
            maBH: 10,
            videoURL: 'https://example.com/video.mp4',
          }),
        ],
      }),
    );

    expect(lessonVideoStorageService.getPlayableUrl).toHaveBeenCalledWith(
      'https://example.com/video.mp4',
    );
  });

  it('returns public recommendations with a cross-sell voucher', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaDM: 4 }])
      .mockResolvedValueOnce([
        {
          maKH: 21,
          tenKhoaHoc: 'Advanced React',
          moTa: 'Mo ta',
          giaBan: '499000',
          hinhAnh: 'https://example.com/react.png',
          averageRating: '4.8',
        },
      ])
      .mockResolvedValueOnce([
        {
          code: 'CROSS10',
          discount: '10',
          discountType: 'PERCENT',
        },
      ]);

    await expect(service.getCourseRecommendations(11, '7')).resolves.toEqual({
      recommendations: [
        {
          maKH: 21,
          tenKhoaHoc: 'Advanced React',
          moTa: 'Mo ta',
          giaBan: 499000,
          hinhAnh: 'https://example.com/react.png',
          averageRating: '4.8',
        },
      ],
      crossSellVoucher: {
        code: 'CROSS10',
        discount: 10,
        discountType: 'PERCENT',
      },
    });
  });

  it('returns the published curriculum grouped by chapter', async () => {
    khoaHocRepository.findOne.mockResolvedValue({
      maKH: 11,
      trangThai: 'PUBLISHED',
    });
    dataSource.query
      .mockResolvedValueOnce([
        {
          maChuong: 1,
          maKH: 11,
          tenChuong: 'Chuong 1',
          thuTu: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          maBH: 10,
          maChuong: 1,
          tenBaiHoc: 'Bai 1',
          videoUrl: 'https://example.com/video.mp4',
          noiDung: 'Noi dung',
          thuTu: 1,
          thoiLuong: 120,
          choPhepXemTruoc: true,
        },
      ]);

    await expect(service.getCourseCurriculum(11)).resolves.toEqual([
      {
        maChuong: 1,
        maKH: 11,
        tenChuong: 'Chuong 1',
        thuTu: 1,
        baiHocs: [
          {
            maBH: 10,
            maChuong: 1,
            tenBaiHoc: 'Bai 1',
            videoUrl: 'https://example.com/video.mp4',
            noiDung: 'Noi dung',
            thuTu: 1,
            thoiLuong: 120,
            choPhepXemTruoc: true,
          },
        ],
      },
    ]);

    expect(lessonVideoStorageService.getPlayableUrl).toHaveBeenCalledWith(
      'https://example.com/video.mp4',
    );
  });
});
