import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CoursesController } from './controllers/course-instructor.controller';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';
import { CoursesService } from './services/course-instructor.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: {
    createCourse: jest.Mock;
  };
  let curriculumService: {
    updateChapter: jest.Mock;
    deleteChapter: jest.Mock;
  };
  let cloudinaryService: {
    uploadFile: jest.Mock;
  };

  beforeEach(async () => {
    coursesService = {
      createCourse: jest.fn(),
    };
    curriculumService = {
      updateChapter: jest.fn(),
      deleteChapter: jest.fn(),
    };
    cloudinaryService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: coursesService },
        {
          provide: CourseInstructorCurriculumService,
          useValue: curriculumService,
        },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updates a chapter for the current instructor', async () => {
    curriculumService.updateChapter.mockResolvedValue({
      maChuong: 5,
      maKH: 10,
      tenChuong: 'Chuong da cap nhat',
      thuTu: 2,
      baiHocs: [],
    });

    const result = await (controller as any).updateChapter(
      '5',
      { user: { sub: 7 } },
      { tenChuong: 'Chuong da cap nhat' },
    );

    expect(curriculumService.updateChapter).toHaveBeenCalledWith(5, 7, {
      tenChuong: 'Chuong da cap nhat',
    });
    expect(result).toEqual({
      message: 'Cap nhat chuong thanh cong',
      data: {
        maChuong: 5,
        maKH: 10,
        tenChuong: 'Chuong da cap nhat',
        thuTu: 2,
        baiHocs: [],
      },
    });
  });

  it('deletes a chapter for the current instructor', async () => {
    curriculumService.deleteChapter.mockResolvedValue(undefined);

    const result = await (controller as any).deleteChapter('5', {
      user: { sub: 7 },
    });

    expect(curriculumService.deleteChapter).toHaveBeenCalledWith(5, 7);
    expect(result).toEqual({
      message: 'Xoa chuong thanh cong',
    });
  });

  it('maps create course price into giaBan and keeps the course paid', async () => {
    coursesService.createCourse.mockResolvedValue({
      maKH: 1,
      maDM: 2,
      maND_GiangVien: 7,
      tenKhoaHoc: 'Khoa hoc test',
      moTa: 'Mo ta',
      giaBan: 250000,
      trangThai: 'DRAFT',
      hinhThuNho: null,
      muc_tieu: [],
      yeu_cau: [],
    });

    const result = await (controller as any).createCourse(
      { user: { sub: 7 } },
      {
        ten_khoa_hoc: 'Khoa hoc test',
        mo_ta: 'Mo ta',
        gia: '250000',
        id_danh_muc: '2',
        muc_tieu: '[]',
        yeu_cau: '[]',
      },
      undefined,
    );

    expect(coursesService.createCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        maDM: 2,
        maND_GiangVien: 7,
        tenKhoaHoc: 'Khoa hoc test',
        giaBan: 250000,
      }),
      [],
      [],
    );
    expect(result.data.giaBan).toBe(250000);
    expect(result.data.gia).toBe(250000);
  });

  it('rejects course creation without category', async () => {
    await expect(
      (controller as any).createCourse(
        { user: { sub: 7 } },
        {
          ten_khoa_hoc: 'Khoa hoc test',
          giaBan: '250000',
          muc_tieu: '[]',
          yeu_cau: '[]',
        },
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
