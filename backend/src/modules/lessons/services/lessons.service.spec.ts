jest.mock('../../lesson-video-storage/lesson-video-storage.service', () => ({
  LessonVideoStorageService: class LessonVideoStorageService {},
}));

import { LessonsService } from './lessons.service';
import { AiStatus } from '../entities/lesson.entity';
import { VideoVersionStatus } from '../entities/video-bai-hoc.entity';

describe('LessonsService', () => {
  it('returns the current draft AI result instead of the stale lesson result', async () => {
    const lessonRepository = {
      find: jest.fn().mockResolvedValue([
        {
          maBH: 101,
          maKH: 10,
          tenBaiHoc: 'Bài có video mới',
          videoURL: 'gs://bucket/public.mp4',
          aiStatus: AiStatus.PROCESSING,
          aiLabels: null,
          aiRejectReason: null,
          durationSeconds: 20,
          resolution: 720,
        },
      ]),
    };
    const videoVersionRepository = {
      find: jest.fn().mockResolvedValue([
        {
          maVideo: 25,
          maBH: 101,
          trangThai: VideoVersionStatus.DRAFT,
          videoURL: 'gs://bucket/draft.mp4',
          aiStatus: AiStatus.REJECTED,
          aiLabels: ['Vi phạm Gemini: Profanity'],
          aiRejectReason: 'Video có phát ngôn không chuẩn mực.',
          durationSeconds: 45,
          resolution: 1080,
          videoSourceType: 'UPLOAD',
        },
      ]),
    };
    const service = new LessonsService(
      lessonRepository as any,
      {} as any,
      videoVersionRepository as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.findAllByCourse(10)).resolves.toEqual([
      expect.objectContaining({
        maBH: 101,
        videoURL: 'gs://bucket/draft.mp4',
        aiStatus: AiStatus.REJECTED,
        aiLabels: ['Vi phạm Gemini: Profanity'],
        aiRejectReason: 'Video có phát ngôn không chuẩn mực.',
        durationSeconds: 45,
        resolution: 1080,
      }),
    ]);
  });
});
