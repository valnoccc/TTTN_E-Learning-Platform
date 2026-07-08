jest.mock(
  '../lesson-video-storage/lesson-video-storage.service',
  () => ({
    LessonVideoStorageService: class LessonVideoStorageService {},
  }),
);

import { Test, TestingModule } from '@nestjs/testing';
import { LessonsController } from './controllers/lesson-instructor.controller';
import { LessonsService } from './services/lessons.service';
import { LessonVideoStorageService } from '../lesson-video-storage/lesson-video-storage.service';
import { VideoIntelligenceService } from './services/video-intelligence.service';

describe('LessonsController', () => {
  let controller: LessonsController;
  let lessonsService: {
    create: jest.Mock;
    update: jest.Mock;
  };
  let lessonVideoStorageService: {
    uploadVideo: jest.Mock;
    deleteVideo: jest.Mock;
    getPlayableUrl: jest.Mock;
  };
  let videoIntelligenceService: {
    checkQuota: jest.Mock;
    analyzeVideoBackground: jest.Mock;
  };

  beforeEach(async () => {
    lessonsService = {
      create: jest.fn(),
      update: jest.fn(),
    };
    lessonVideoStorageService = {
      uploadVideo: jest.fn(),
      deleteVideo: jest.fn(),
      getPlayableUrl: jest.fn(async (url) => url),
    };
    videoIntelligenceService = {
      checkQuota: jest.fn().mockResolvedValue(undefined),
      analyzeVideoBackground: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        { provide: LessonsService, useValue: lessonsService },
        {
          provide: LessonVideoStorageService,
          useValue: lessonVideoStorageService,
        },
        { provide: VideoIntelligenceService, useValue: videoIntelligenceService },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('parses the preview flag when creating a lesson', async () => {
    lessonsService.create.mockResolvedValue({
      maBH: 1,
      choPhepXemTruoc: true,
    });

    await controller.create(
      {},
      {
        maKH: '10',
        tieu_de: 'Bài học thử',
        noi_dung: 'Nội dung',
        thu_tu: '2',
        choPhepXemTruoc: 'true',
      },
      undefined as any,
    );

    expect(lessonsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        maKH: 10,
        thuTu: 2,
        choPhepXemTruoc: true,
      }),
    );
  });

  it('parses the preview flag when updating a lesson', async () => {
    lessonsService.update.mockResolvedValue({
      maBH: 1,
      choPhepXemTruoc: false,
    });

    await controller.update(
      1,
      {
        tieu_de: 'Bài học cập nhật',
        noi_dung: 'Nội dung mới',
        thu_tu: '3',
        cho_phep_xem_truoc: 'false',
      },
      undefined as any,
    );

    expect(lessonsService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        thuTu: 3,
        choPhepXemTruoc: false,
      }),
    );
  });

  it('uses the GCS URI for AI analysis after uploading a lesson video', async () => {
    lessonVideoStorageService.uploadVideo.mockResolvedValue({
      bucketName: 'video-storage-lvtn',
      objectName: 'lessons-videos/course-10/lesson-1/test.mp4',
      url: 'https://storage.googleapis.com/video-storage-lvtn/lessons-videos/course-10/lesson-1/test.mp4',
      gcsUri: 'gs://video-storage-lvtn/lessons-videos/course-10/lesson-1/test.mp4',
    });
    lessonsService.create.mockResolvedValue({
      maBH: 123,
      maKH: 10,
    });

    await controller.create(
      {},
      {
        maKH: '10',
        tieu_de: 'Bài học có video',
        noi_dung: 'Nội dung',
        thu_tu: '1',
        thoiLuong: '120',
      },
      {
        buffer: Buffer.from('video'),
        mimetype: 'video/mp4',
        originalname: 'lesson.mp4',
      } as any,
    );

    expect(videoIntelligenceService.checkQuota).toHaveBeenCalledWith(120);
    expect(videoIntelligenceService.analyzeVideoBackground).toHaveBeenCalledWith(
      123,
      'gs://video-storage-lvtn/lessons-videos/course-10/lesson-1/test.mp4',
    );
  });
});
