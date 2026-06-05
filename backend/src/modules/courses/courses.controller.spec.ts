import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CoursesController } from './controllers/course-instructor.controller';
import { CoursesService } from './services/course-instructor.service';
import { KhoaHoc } from './entities/course.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('CoursesController', () => {
  let controller: CoursesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        CoursesService,
        { provide: getRepositoryToken(KhoaHoc), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
