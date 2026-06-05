import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LessonsController } from './controllers/lesson-instructor.controller';
import { LessonsService } from './services/lessons.service';
import { Lesson } from './entities/lesson.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('LessonsController', () => {
  let controller: LessonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        LessonsService,
        { provide: getRepositoryToken(Lesson), useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: CloudinaryService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
