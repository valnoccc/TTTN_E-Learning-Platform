import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { LessonsService } from './services/lessons.service';

describe('LessonsService', () => {
  let service: LessonsService;
  let lessonRepository: {
    preload: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let cloudinaryService: {
    extractPublicId: jest.Mock;
    deleteFile: jest.Mock;
  };

  beforeEach(async () => {
    lessonRepository = {
      preload: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    cloudinaryService = {
      extractPublicId: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: getRepositoryToken(Lesson), useValue: lessonRepository },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deletes the previous Cloudinary video when replacing a lesson video', async () => {
    lessonRepository.findOne.mockResolvedValue({
      maBH: 1,
      videoURL: 'https://res.cloudinary.com/demo/video/upload/v123/lessons_videos/old-video.mp4',
    });
    lessonRepository.preload.mockResolvedValue({
      maBH: 1,
      videoURL: 'https://res.cloudinary.com/demo/video/upload/v456/lessons_videos/new-video.mp4',
    });
    lessonRepository.save.mockResolvedValue({
      maBH: 1,
      videoURL: 'https://res.cloudinary.com/demo/video/upload/v456/lessons_videos/new-video.mp4',
    });
    cloudinaryService.extractPublicId.mockReturnValue('lessons_videos/old-video');

    await service.update(1, {
      videoURL: 'https://res.cloudinary.com/demo/video/upload/v456/lessons_videos/new-video.mp4',
    });

    expect(cloudinaryService.extractPublicId).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/video/upload/v123/lessons_videos/old-video.mp4',
    );
    expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
      'lessons_videos/old-video',
      'video',
    );
  });
});
