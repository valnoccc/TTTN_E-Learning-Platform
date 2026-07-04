import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';
import { AiQuotaTracker } from '../entities/ai-quota-tracker.entity';
import { AiStatus, Lesson } from '../entities/lesson.entity';
import { VideoIntelligenceService } from './video-intelligence.service';

const annotateVideoMock = jest.fn();

jest.mock('@google-cloud/video-intelligence', () => ({
  VideoIntelligenceServiceClient: jest.fn().mockImplementation(() => ({
    annotateVideo: annotateVideoMock,
  })),
}));

describe('VideoIntelligenceService', () => {
  let service: VideoIntelligenceService;
  type LessonRecord = {
    maBH: number;
    maKH: number;
    videoURL: string | null;
    aiStatus: AiStatus | null;
  };
  let lessonRepository: {
    update: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let quotaRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    query: jest.Mock;
  };
  let courseRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
  };
  type TestableVideoIntelligenceService = {
    runAnalysis: (lessonId: number, videoUrl: string) => Promise<void>;
  };

  beforeEach(async () => {
    annotateVideoMock.mockReset();

    lessonRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    quotaRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
    };
    courseRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoIntelligenceService,
        { provide: getRepositoryToken(Lesson), useValue: lessonRepository },
        {
          provide: getRepositoryToken(AiQuotaTracker),
          useValue: quotaRepository,
        },
        { provide: getRepositoryToken(KhoaHoc), useValue: courseRepository },
      ],
    }).compile();

    service = module.get<VideoIntelligenceService>(VideoIntelligenceService);

    quotaRepository.findOne.mockResolvedValue({
      monthYear: '07-2026',
      usedSeconds: 0,
    });
    quotaRepository.save.mockResolvedValue({
      monthYear: '07-2026',
      usedSeconds: 0,
    });
  });

  it('approves a safe video with a single likely frame and auto-publishes a pending course', async () => {
    const lessonsState: LessonRecord[] = [
      {
        maBH: 1,
        maKH: 10,
        videoURL: 'https://cdn.example.com/lesson-1.mp4',
        aiStatus: null,
      },
      {
        maBH: 2,
        maKH: 10,
        videoURL: 'https://cdn.example.com/lesson-2.mp4',
        aiStatus: AiStatus.APPROVED,
      },
      {
        maBH: 3,
        maKH: 10,
        videoURL: null,
        aiStatus: null,
      },
    ];

    lessonRepository.findOne.mockImplementation(
      ({ where }: { where: { maBH?: number; maKH?: number } }) => {
        if ('maBH' in where) {
          return lessonsState.find((item) => item.maBH === where.maBH) ?? null;
        }
        if ('maKH' in where) {
          return lessonsState.find((item) => item.maKH === where.maKH) ?? null;
        }
        return null;
      },
    );
    lessonRepository.find.mockImplementation(
      ({ where }: { where: { maKH: number } }) =>
        lessonsState.filter((item) => item.maKH === where.maKH),
    );
    lessonRepository.update.mockImplementation(
      (lessonId: number, patch: Partial<LessonRecord>) => {
        const lesson = lessonsState.find((item) => item.maBH === lessonId);
        if (lesson) {
          Object.assign(lesson, patch);
        }
        return Promise.resolve({ affected: 1 });
      },
    );
    courseRepository.findOne.mockResolvedValue({
      maKH: 10,
      trangThai: 'PENDING',
    });
    courseRepository.update.mockResolvedValue({ affected: 1 });
    annotateVideoMock.mockResolvedValue([
      {
        promise: jest.fn().mockResolvedValue([
          {
            annotationResults: [
              {
                segment: { endTimeOffset: { seconds: 120 } },
                explicitAnnotation: {
                  frames: [{ pornographyLikelihood: 'LIKELY' }],
                },
                shotLabelAnnotations: [
                  { entity: { description: 'lecture' } },
                  { entity: { description: 'slide' } },
                ],
                segmentLabelAnnotations: [],
              },
            ],
          },
        ]),
      },
    ]);

    const analysisService =
      service as unknown as TestableVideoIntelligenceService;

    await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiStatus: AiStatus.APPROVED,
        aiRejectReason: null,
      }),
    );
    expect(courseRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        trangThai: 'PUBLISHED',
      }),
    );
  });

  it('rejects only when the explicit signal is very strong', async () => {
    lessonRepository.findOne.mockImplementation(
      ({ where }: { where: { maBH?: number; maKH?: number } }) => {
        if ('maBH' in where) {
          return {
            maBH: where.maBH,
            maKH: 10,
            videoURL: 'https://cdn.example.com/lesson-1.mp4',
            aiStatus: null,
          };
        }
        if ('maKH' in where) {
          return { maKH: where.maKH, trangThai: 'PENDING' };
        }
        return null;
      },
    );
    lessonRepository.find.mockResolvedValue([
      {
        maBH: 1,
        maKH: 10,
        videoURL: 'https://cdn.example.com/lesson-1.mp4',
        aiStatus: null,
      },
    ]);
    lessonRepository.update.mockResolvedValue({ affected: 1 });
    courseRepository.findOne.mockResolvedValue({
      maKH: 10,
      trangThai: 'PENDING',
    });
    annotateVideoMock.mockResolvedValue([
      {
        promise: jest.fn().mockResolvedValue([
          {
            annotationResults: [
              {
                segment: { endTimeOffset: { seconds: 95 } },
                explicitAnnotation: {
                  frames: [
                    { pornographyLikelihood: 'VERY_LIKELY' },
                    { pornographyLikelihood: 'VERY_LIKELY' },
                    { pornographyLikelihood: 'VERY_LIKELY' },
                  ],
                },
                shotLabelAnnotations: [],
                segmentLabelAnnotations: [],
              },
            ],
          },
        ]),
      },
    ]);

    const analysisService =
      service as unknown as TestableVideoIntelligenceService;

    await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiStatus: AiStatus.REJECTED,
      }),
    );
    expect(courseRepository.update).not.toHaveBeenCalled();
  });

  it('keeps the lesson pending when the AI provider fails', async () => {
    lessonRepository.findOne.mockImplementation(
      ({ where }: { where: { maBH?: number; maKH?: number } }) => {
        if ('maBH' in where) {
          return {
            maBH: where.maBH,
            maKH: 10,
            videoURL: 'https://cdn.example.com/lesson-1.mp4',
            aiStatus: null,
          };
        }
        if ('maKH' in where) {
          return { maKH: where.maKH, trangThai: 'PENDING' };
        }
        return null;
      },
    );
    lessonRepository.update.mockResolvedValue({ affected: 1 });
    annotateVideoMock.mockRejectedValue(new Error('network timeout'));

    const analysisService =
      service as unknown as TestableVideoIntelligenceService;

    await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiStatus: AiStatus.PENDING,
        aiRejectReason: null,
      }),
    );
    expect(courseRepository.update).not.toHaveBeenCalled();
  });
});
