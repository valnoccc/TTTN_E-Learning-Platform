const saveMock = jest.fn();
const makePublicMock = jest.fn();
const deleteMock = jest.fn();
const fileMock = {
  save: saveMock,
  makePublic: makePublicMock,
  delete: deleteMock,
};
const bucketMock = {
  file: jest.fn(() => fileMock),
};

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn(() => bucketMock),
  })),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

import { ConfigService } from '@nestjs/config';
import { LessonVideoStorageService } from './lesson-video-storage.service';

describe('LessonVideoStorageService', () => {
  let service: LessonVideoStorageService;
  let configService: {
    get: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };

  beforeEach(() => {
    saveMock.mockReset();
    makePublicMock.mockReset();
    deleteMock.mockReset();
    bucketMock.file.mockClear();
    dataSource = {
      query: jest.fn().mockResolvedValue(undefined),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'GCS_BUCKET_NAME') {
          return 'video-storage-lvtn';
        }
        if (key === 'GCP_PROJECT_ID') {
          return 'video-intelligence-app-500806';
        }
        return undefined;
      }),
    };

    service = new LessonVideoStorageService(
      configService as ConfigService,
      dataSource as never,
    );
  });

  it('uploads a video to GCS without trying to set object ACLs', async () => {
    saveMock.mockResolvedValue(undefined);

    const result = await service.uploadVideo(
      {
        buffer: Buffer.from('video'),
        mimetype: 'video/mp4',
        originalname: 'lecture.mp4',
      },
      {
        courseId: 480001,
        lessonId: 600001,
      },
    );

    expect(bucketMock.file).toHaveBeenCalledWith(
      'lessons-videos/course-480001/lesson-600001/test-uuid.mp4',
    );
    expect(saveMock).toHaveBeenCalledWith(Buffer.from('video'), {
      resumable: false,
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000',
      },
    });
    expect(makePublicMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      bucketName: 'video-storage-lvtn',
      objectName: 'lessons-videos/course-480001/lesson-600001/test-uuid.mp4',
      url: 'https://storage.googleapis.com/video-storage-lvtn/lessons-videos/course-480001/lesson-600001/test-uuid.mp4',
      gcsUri:
        'gs://video-storage-lvtn/lessons-videos/course-480001/lesson-600001/test-uuid.mp4',
    });
  });

  it('records monthly storage usage into tracker table', async () => {
    await service.recordMonthlyUsage(2_097_152);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO VideoStorageQuotaTracker'),
      expect.arrayContaining([expect.any(String), 2_097_152, 2_097_152]),
    );
  });
});
