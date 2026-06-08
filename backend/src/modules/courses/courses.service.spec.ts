import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CoursesService } from './services/course-instructor.service';
import { KhoaHoc } from './entities/course.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let khoaHocRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };
  let cloudinaryService: {
    extractPublicId: jest.Mock;
    deleteFile: jest.Mock;
  };

  beforeEach(async () => {
    khoaHocRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };
    cloudinaryService = {
      extractPublicId: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(KhoaHoc), useValue: khoaHocRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deletes the previous Cloudinary thumbnail when replacing a course image', async () => {
    khoaHocRepository.findOne.mockResolvedValue({
      maKH: 10,
      maND_GiangVien: 7,
      hinhThuNho: 'https://res.cloudinary.com/demo/image/upload/v123/course_thumbnails/old-thumb.jpg',
    });
    khoaHocRepository.save.mockImplementation(async (course) => course);
    cloudinaryService.extractPublicId.mockReturnValue('course_thumbnails/old-thumb');

    await service.updateCourse(
      10,
      7,
      {
        hinhThuNho: 'https://res.cloudinary.com/demo/image/upload/v456/course_thumbnails/new-thumb.jpg',
      },
      [],
      [],
    );

    expect(cloudinaryService.extractPublicId).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/image/upload/v123/course_thumbnails/old-thumb.jpg',
    );
    expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
      'course_thumbnails/old-thumb',
      'image',
    );
  });
});
