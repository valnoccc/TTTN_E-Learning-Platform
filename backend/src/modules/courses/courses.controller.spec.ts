import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './controllers/course-instructor.controller';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';
import { CoursesService } from './services/course-instructor.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let curriculumService: {
    updateChapter: jest.Mock;
    deleteChapter: jest.Mock;
  };

  beforeEach(async () => {
    curriculumService = {
      updateChapter: jest.fn(),
      deleteChapter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: {} },
        {
          provide: CourseInstructorCurriculumService,
          useValue: curriculumService,
        },
        { provide: CloudinaryService, useValue: {} },
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
});
