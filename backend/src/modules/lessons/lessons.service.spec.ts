import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { LessonsService } from './services/lessons.service';

describe('LessonsService', () => {
  let service: LessonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: getRepositoryToken(Lesson), useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
