import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './controllers/course-instructor.controller';
import { CourseInstructorCurriculumService } from './services/course-instructor-curriculum.service';
import { CoursesService } from './services/course-instructor.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('CoursesController', () => {
  let controller: CoursesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: {} },
        { provide: CourseInstructorCurriculumService, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
