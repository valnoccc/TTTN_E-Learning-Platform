import { BadRequestException } from '@nestjs/common';
import { LessonVideoVersionService } from './lesson-video-version.service';

describe('LessonVideoVersionService', () => {
  const dataSource = {
    query: jest.fn(),
    transaction: jest.fn(),
  };

  let service: LessonVideoVersionService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new LessonVideoVersionService(dataSource as never);
  });

  it('creates a draft version without changing the existing public lesson URL', async () => {
    dataSource.query
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ insertId: 21 }]);

    await expect(
      service.createDraft({
        lessonId: 840001,
        objectName: 'courses/100/lessons/840001/videos/new.mp4',
        videoUrl: 'gs://bucket/courses/100/lessons/840001/videos/new.mp4',
        durationSeconds: 120,
        resolution: 1080,
        aiStatus: 'PROCESSING',
      }),
    ).resolves.toEqual({ id: 21, status: 'DRAFT' });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO VideoBaiHoc'),
      expect.arrayContaining([
        840001,
        'courses/100/lessons/840001/videos/new.mp4',
        'gs://bucket/courses/100/lessons/840001/videos/new.mp4',
      ]),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE VideoBaiHoc[\s\S]*TrangThai = 'ARCHIVED'/),
      [840001],
    );
    expect(dataSource.query).toHaveBeenCalledTimes(2);
  });

  it('rejects publication while a draft video is still awaiting moderation', async () => {
    const manager = { query: jest.fn() };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    manager.query.mockResolvedValueOnce([
      { maVideo: 21, maBH: 840001, aiStatus: 'PROCESSING' },
    ]);

    await expect(service.publishCourseVideos(100, 7)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('marks only rejected or manually-review draft videos as approved for an admin-approved appeal', async () => {
    dataSource.query.mockResolvedValue({ affectedRows: 2 });

    await expect(
      (service as any).approveAppealedDraftVideos(100),
    ).resolves.toEqual({ affectedRows: 2 });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringMatching(
        /UPDATE VideoBaiHoc[\s\S]*AiStatus = 'APPROVED'[\s\S]*AiStatus IN \('REJECTED', 'NEEDS_REVIEW'\)/,
      ),
      [100],
    );
  });

  it('publishes a moderated draft and archives the previous public version', async () => {
    const manager = { query: jest.fn() };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    manager.query
      .mockResolvedValueOnce([
        {
          maVideo: 22,
          maBH: 840001,
          aiStatus: 'APPROVED',
          aiLabels: JSON.stringify(['conversation', 'learning']),
          videoUrl: 'gs://bucket/new.mp4',
          durationSeconds: 180,
          resolution: 720,
        },
      ])
      .mockResolvedValue({ affectedRows: 1 });

    await expect(service.publishCourseVideos(100, 7)).resolves.toEqual({
      publishedCount: 1,
    });

    expect(manager.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE VideoBaiHoc[\s\S]*TrangThai = 'ARCHIVED'/),
      expect.arrayContaining([840001]),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE VideoBaiHoc[\s\S]*TrangThai = 'PUBLIC'/),
      expect.arrayContaining([22]),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE BaiHoc[\s\S]*SET VideoURL = \?/),
      expect.arrayContaining([
        'gs://bucket/new.mp4',
        JSON.stringify(['conversation', 'learning']),
        840001,
      ]),
    );
  });

  it('serializes array AI labels before updating the lesson JSON column', async () => {
    const manager = { query: jest.fn() };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    manager.query
      .mockResolvedValueOnce([
        {
          maVideo: 23,
          maBH: 840002,
          aiStatus: 'APPROVED',
          aiLabels: ['Gemini: Ngôn từ phù hợp', 'diagram'],
          videoUrl: 'gs://bucket/new-2.mp4',
          durationSeconds: 206,
          resolution: null,
        },
      ])
      .mockResolvedValue({ affectedRows: 1 });

    await service.publishCourseVideos(100, 7);

    expect(manager.query).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE BaiHoc[\s\S]*AiLabels = \?/),
      expect.arrayContaining([
        JSON.stringify(['Gemini: Ngôn từ phù hợp', 'diagram']),
      ]),
    );
  });
});
