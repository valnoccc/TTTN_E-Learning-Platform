import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { KhoaHoc } from './entities/course.entity';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';

describe('CourseInstructorCurriculumService', () => {
  let service: CourseInstructorCurriculumService;
  let khoaHocRepository: {
    findOne: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };

  beforeEach(async () => {
    khoaHocRepository = {
      findOne: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseInstructorCurriculumService,
        { provide: getRepositoryToken(KhoaHoc), useValue: khoaHocRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CourseInstructorCurriculumService>(
      CourseInstructorCurriculumService,
    );
  });

  it('updates a chapter title and keeps its lessons sorted', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        { maChuong: 5, maKH: 10, tenChuong: 'Chuong cu', thuTu: 2 },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        {
          maBH: 12,
          maChuong: 5,
          tenBaiHoc: 'Bai 2',
          videoUrl: null,
          noiDung: null,
          thuTu: 2,
          thoiLuong: 0,
          choPhepXemTruoc: 0,
        },
        {
          maBH: 11,
          maChuong: 5,
          tenBaiHoc: 'Bai 1',
          videoUrl: null,
          noiDung: null,
          thuTu: 1,
          thoiLuong: 0,
          choPhepXemTruoc: 0,
        },
      ]);

    await expect(
      (service as any).updateChapter(5, 7, { tenChuong: 'Chuong moi' }),
    ).resolves.toEqual({
      maChuong: 5,
      maKH: 10,
      tenChuong: 'Chuong moi',
      thuTu: 2,
      baiHocs: [
        expect.objectContaining({ maBH: 11, thuTu: 1 }),
        expect.objectContaining({ maBH: 12, thuTu: 2 }),
      ],
    });
  });

  it('throws when deleting a chapter outside the instructor ownership', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect((service as any).deleteChapter(5, 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deletes a chapter and its lessons for the owning instructor', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        { maChuong: 5, maKH: 10, tenChuong: 'Chuong 1', thuTu: 1 },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect((service as any).deleteChapter(5, 7)).resolves.toBeUndefined();

    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM BaiHoc'),
      [5],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('DELETE FROM ChuongHoc'),
      [5],
    );
  });
});
