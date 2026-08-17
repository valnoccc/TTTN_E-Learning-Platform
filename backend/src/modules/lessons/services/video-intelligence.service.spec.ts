import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';
import { AiQuotaTracker } from '../entities/ai-quota-tracker.entity';
import { AiStatus, Lesson } from '../entities/lesson.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { VideoIntelligenceService } from './video-intelligence.service';
import { DataSource } from 'typeorm';

jest.mock('../../lesson-video-storage/lesson-video-storage.service', () => ({
  LessonVideoStorageService: class {},
}));
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';

const annotateVideoMock = jest.fn();
const generateContentMock = jest.fn();
const uploadGeminiFileMock = jest.fn();
const getGeminiFileMock = jest.fn();
const deleteGeminiFileMock = jest.fn();
const downloadVideoForAiMock = jest.fn();

jest.mock('@google-cloud/video-intelligence', () => ({
  VideoIntelligenceServiceClient: jest.fn().mockImplementation(() => ({
    annotateVideo: annotateVideoMock,
  })),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: generateContentMock,
    }),
  })),
}));

jest.mock('@google/generative-ai/server', () => ({
  GoogleAIFileManager: jest.fn().mockImplementation(() => ({
    uploadFile: uploadGeminiFileMock,
    getFile: getGeminiFileMock,
    deleteFile: deleteGeminiFileMock,
  })),
  FileState: {
    ACTIVE: 'ACTIVE',
    PROCESSING: 'PROCESSING',
    FAILED: 'FAILED',
  },
}));

import { ConfigService } from '@nestjs/config';

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
    query: jest.Mock;
  };
  let quotaRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    query: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };
  let notificationsService: {
    createNotification: jest.Mock;
  };
  let courseRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
  };
  type TestableVideoIntelligenceService = {
    runAnalysis: (
      lessonId: number,
      videoUrl: string,
    ) => Promise<{
      lessonId: number;
      status: AiStatus;
      labels: string[];
      rejectReason: string | null;
      durationSeconds: number;
      riskyFrameCount: number;
      likelyFrameCount: number;
    }>;
  };

  beforeEach(async () => {
    annotateVideoMock.mockReset();
    generateContentMock.mockReset();
    uploadGeminiFileMock.mockReset();
    getGeminiFileMock.mockReset();
    deleteGeminiFileMock.mockReset();
    uploadGeminiFileMock.mockResolvedValue({
      file: {
        name: 'files/lesson-video',
        uri: 'https://generativelanguage.googleapis.com/v1beta/files/lesson-video',
        mimeType: 'video/mp4',
        state: 'ACTIVE',
      },
    });
    getGeminiFileMock.mockResolvedValue({
      name: 'files/lesson-video',
      uri: 'https://generativelanguage.googleapis.com/v1beta/files/lesson-video',
      mimeType: 'video/mp4',
      state: 'ACTIVE',
    });
    deleteGeminiFileMock.mockResolvedValue(undefined);
    downloadVideoForAiMock.mockReset();
    downloadVideoForAiMock.mockResolvedValue({
      buffer: Buffer.from('video-content'),
      mimeType: 'video/mp4',
    });

    lessonRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    };
    quotaRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    };
    notificationsService = {
      createNotification: jest.fn(),
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
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('fake-key') } },
        {
          provide: LessonVideoStorageService,
          useValue: {
            downloadVideoForAi: downloadVideoForAiMock,
          },
        },
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

  it('keeps up to 15 labels returned by frame moderation', () => {
    const analysisService = service as unknown as {
      evaluateAnnotation: (annotation: unknown) => { labels: string[] };
    };
    const frameLabels = Array.from({ length: 18 }, (_, index) => ({
      entity: { description: `frame-label-${index + 1}` },
    }));

    const result = analysisService.evaluateAnnotation({
      segment: { endTimeOffset: { seconds: 60 } },
      explicitAnnotation: { frames: [] },
      shotLabelAnnotations: frameLabels,
      segmentLabelAnnotations: [],
    });

    expect(result.labels).toHaveLength(15);
    expect(result.labels).toEqual(
      frameLabels.slice(0, 15).map((label) => label.entity.description),
    );
  });

  it('uploads the GCS video through Gemini Files API and deletes it afterwards', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            isApproved: true,
            violationType: null,
            reason: 'Nội dung an toàn',
            confidenceScore: 0.95,
          }),
      },
    });

    const analysisService = service as unknown as {
      analyzeVideoWithGemini: (videoUrl: string) => Promise<unknown>;
    };

    await analysisService.analyzeVideoWithGemini('gs://test-bucket/lesson.mp4');

    expect(downloadVideoForAiMock).toHaveBeenCalledWith(
      'gs://test-bucket/lesson.mp4',
    );
    expect(uploadGeminiFileMock).toHaveBeenCalledWith(
      Buffer.from('video-content'),
      expect.objectContaining({ mimeType: 'video/mp4' }),
    );
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          fileData: expect.objectContaining({
            fileUri: expect.stringContaining('/files/lesson-video'),
          }),
        }),
      ]),
    );
    expect(deleteGeminiFileMock).toHaveBeenCalledWith('files/lesson-video');
  });

  it('marks a video with a single likely frame as needs review', async () => {
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
    // Gemini mặc định trả về 'cần xét admin' vì đây là test NEEDS_REVIEW
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            isApproved: true,
            violationType: null,
            reason: 'Nội dung an toàn',
            confidenceScore: 0.95,
          }),
      },
    });
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

    const result = await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiStatus: AiStatus.NEEDS_REVIEW,
        aiRejectReason: expect.stringContaining('cần admin xem xét'),
      }),
    );
    expect(result.status).toBe(AiStatus.NEEDS_REVIEW);
    expect(courseRepository.update).not.toHaveBeenCalled();
  });

  it('runs semantic moderation even when visual moderation rejects a video', async () => {
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
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            isApproved: true,
            violationType: null,
            reason: 'Nội dung an toàn',
            confidenceScore: 0.95,
          }),
      },
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

    const result = await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiStatus: AiStatus.REJECTED,
      }),
    );
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(result.labels).toContain('Gemini: Ngôn từ phù hợp');
    expect(courseRepository.update).not.toHaveBeenCalled();
  });

  it('prioritizes sensitive labels before limiting labels stored for a lesson', async () => {
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
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            isApproved: true,
            violationType: null,
            reason: 'Nội dung an toàn',
            confidenceScore: 0.95,
          }),
      },
    });
    annotateVideoMock.mockResolvedValue([
      {
        promise: jest.fn().mockResolvedValue([
          {
            annotationResults: [
              {
                segment: { endTimeOffset: { seconds: 95 } },
                explicitAnnotation: { frames: [] },
                shotLabelAnnotations: [
                  { entity: { description: 'road' } },
                  { entity: { description: 'parking' } },
                  { entity: { description: 'car' } },
                  { entity: { description: 'driving' } },
                  { entity: { description: 'visual effects' } },
                  { entity: { description: 'violence' } },
                  { entity: { description: 'weapon' } },
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

    const result = await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(result.status).toBe(AiStatus.REJECTED);
    expect(result.labels).toEqual([
      'violence',
      'weapon',
      'Gemini: Ngôn từ phù hợp',
      'road',
      'parking',
      'car',
      'driving',
      'visual effects',
    ]);
    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiLabels: [
          'violence',
          'weapon',
          'Gemini: Ngôn từ phù hợp',
          'road',
          'parking',
          'car',
          'driving',
          'visual effects',
        ],
      }),
    );
  });

  it('stores the Gemini violation type as the first moderation label', async () => {
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
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            isApproved: false,
            violationType: 'Bạo lực',
            reason: 'Video mô tả hành vi bạo lực.',
            confidenceScore: 0.96,
          }),
      },
    });
    annotateVideoMock.mockResolvedValue([
      {
        promise: jest.fn().mockResolvedValue([
          {
            annotationResults: [
              {
                segment: { endTimeOffset: { seconds: 95 } },
                explicitAnnotation: { frames: [] },
                shotLabelAnnotations: [
                  { entity: { description: 'classroom' } },
                  { entity: { description: 'conversation' } },
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

    const result = await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(result.status).toBe(AiStatus.REJECTED);
    expect(result.labels).toEqual([
      'Vi phạm Gemini: Bạo lực',
      'classroom',
      'conversation',
    ]);
  });

  it('marks the lesson as needs review when the AI provider fails', async () => {
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

    const result = await analysisService.runAnalysis(
      1,
      'https://cdn.example.com/lesson-1.mp4',
    );

    expect(lessonRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        aiStatus: AiStatus.NEEDS_REVIEW,
        aiRejectReason: expect.stringContaining('Lỗi kỹ thuật khi phân tích'),
      }),
    );
    expect(result.status).toBe(AiStatus.NEEDS_REVIEW);
    expect(courseRepository.update).not.toHaveBeenCalled();
  });
});
