jest.mock('../../lesson-video-storage/lesson-video-storage.service', () => ({
  LessonVideoStorageService: class LessonVideoStorageService {},
}));

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { KhoaHoc } from '../entities/course.entity';
import { CoursesService } from './course-instructor.service';

describe('CoursesService.updateCourseStatus', () => {
  const courseRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const dataSource = {
    query: jest.fn(),
  };

  const cloudinaryService = {
    extractPublicId: jest.fn(),
    deleteFile: jest.fn(),
  };

  const lessonVideoStorageService = {
    deleteVideo: jest.fn(),
  };

  const notificationsService = {
    createNotification: jest.fn(),
  };

  const service = new CoursesService(
    courseRepository as never,
    dataSource as never,
    cloudinaryService as never,
    lessonVideoStorageService as never,
    notificationsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    courseRepository.findOne.mockResolvedValue({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'PENDING',
    } as KhoaHoc);
  });

  it('auto-publishes the course when every lesson is approved', async () => {
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'B?i 1', aiStatus: 'APPROVED' },
      { maBH: 2, tenBaiHoc: 'B?i 2', aiStatus: 'APPROVED' },
    ]);

    await expect(service.updateCourseStatus(11, 99, 'PENDING')).resolves.toEqual(
      expect.objectContaining({
        id: 11,
        trangThai: 'PUBLISHED',
        reviewRatio: 0,
        reviewCount: 0,
        totalVideoLessons: 2,
      }),
    );

    expect(courseRepository.update).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ trangThai: 'PUBLISHED' }),
    );
    expect(notificationsService.createNotification).not.toHaveBeenCalled();
  });

  it('sends the course to admin review when the review ratio is between 20 and 40 percent', async () => {
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'B?i 1', aiStatus: 'APPROVED' },
      { maBH: 2, tenBaiHoc: 'B?i 2', aiStatus: 'APPROVED' },
      { maBH: 3, tenBaiHoc: 'B?i 3', aiStatus: 'APPROVED' },
      { maBH: 4, tenBaiHoc: 'B?i 4', aiStatus: 'NEEDS_REVIEW' },
      { maBH: 5, tenBaiHoc: 'B?i 5', aiStatus: 'REJECTED' },
    ]);

    await expect(service.updateCourseStatus(11, 99, 'PENDING')).resolves.toEqual(
      expect.objectContaining({
        id: 11,
        trangThai: 'PENDING',
        reviewRatio: 0.4,
        reviewCount: 2,
        totalVideoLessons: 5,
      }),
    );

    expect(courseRepository.update).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ trangThai: 'PENDING' }),
    );
    expect(notificationsService.createNotification).not.toHaveBeenCalled();
  });

  it('auto-rejects submission when the review ratio is above 40 percent and sends a notification', async () => {
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'B?i 1', aiStatus: 'APPROVED' },
      { maBH: 2, tenBaiHoc: 'B?i 2', aiStatus: 'NEEDS_REVIEW' },
      { maBH: 3, tenBaiHoc: 'B?i 3', aiStatus: 'NEEDS_REVIEW' },
      { maBH: 4, tenBaiHoc: 'B?i 4', aiStatus: 'REJECTED' },
      { maBH: 5, tenBaiHoc: 'B?i 5', aiStatus: 'REJECTED' },
    ]);

    await expect(service.updateCourseStatus(11, 99, 'PENDING')).resolves.toEqual(
      expect.objectContaining({
        id: 11,
        trangThai: 'DRAFT',
        reviewRatio: 0.8,
        reviewCount: 4,
        totalVideoLessons: 5,
      }),
    );

    expect(courseRepository.update).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ trangThai: 'DRAFT' }),
    );
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        maND: 99,
        tieuDe: 'Khóa học bị từ chối tự động',
      }),
    );
  });
});
