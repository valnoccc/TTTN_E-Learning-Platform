jest.mock('../../lesson-video-storage/lesson-video-storage.service', () => ({
  LessonVideoStorageService: class LessonVideoStorageService {},
}));

import { VideoCleanupService } from './video-cleanup.service';

describe('VideoCleanupService', () => {
  const dataSource = { query: jest.fn() };
  const videoStorage = { deleteVideo: jest.fn() };

  let service: VideoCleanupService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new VideoCleanupService(dataSource as never, videoStorage as never);
  });

  it('deletes only expired archived videos that are no longer referenced', async () => {
    dataSource.query.mockResolvedValue([
      {
        maVideo: 11,
        videoUrl: 'gs://bucket/lessons-videos/old.mp4',
      },
      {
        maVideo: 12,
        videoUrl: 'gs://bucket/lessons-videos/failed-delete.mp4',
      },
    ]);
    videoStorage.deleteVideo
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await expect(
      service.cleanupArchivedVideos(new Date('2026-08-17T00:00:00.000Z')),
    ).resolves.toEqual({ scanned: 2, deleted: 1, failed: 1 });

    expect(videoStorage.deleteVideo).toHaveBeenNthCalledWith(
      1,
      'gs://bucket/lessons-videos/old.mp4',
    );
    expect(dataSource.query).toHaveBeenLastCalledWith(
      expect.stringContaining('DELETE FROM VideoBaiHoc'),
      [11],
    );
  });

  it('does not delete any video when no expired archive exists', async () => {
    dataSource.query.mockResolvedValue([]);

    await expect(
      service.cleanupArchivedVideos(new Date('2026-08-17T00:00:00.000Z')),
    ).resolves.toEqual({ scanned: 0, deleted: 0, failed: 0 });

    expect(videoStorage.deleteVideo).not.toHaveBeenCalled();
  });
});
