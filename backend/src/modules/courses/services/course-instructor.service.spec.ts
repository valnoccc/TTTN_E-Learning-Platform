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
    save: jest.fn(),
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
    jest.resetAllMocks();
    courseRepository.findOne.mockResolvedValue({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'PENDING',
    } as KhoaHoc);
    courseRepository.save.mockImplementation(async (course) => course);
  });

  it('archives a purchased course instead of deleting it', async () => {
    dataSource.query.mockResolvedValueOnce([{ count: '1' }]);

    await expect(service.remove(11, 99)).resolves.toEqual(
      expect.objectContaining({
        message: expect.stringContaining('lưu trữ hoàn toàn'),
      }),
    );

    expect(courseRepository.update).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ trangThai: 'ARCHIVED' }),
    );
  });

  it('submits the course for manual admin review when every lesson is approved', async () => {
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'B?i 1', aiStatus: 'APPROVED' },
      { maBH: 2, tenBaiHoc: 'B?i 2', aiStatus: 'APPROVED' },
    ]);

    await expect(
      service.updateCourseStatus(11, 99, 'PENDING'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 11,
        trangThai: 'PENDING',
        reviewCount: 0,
        totalVideoLessons: 2,
      }),
    );

    expect(courseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ trangThai: 'PENDING' }),
    );
    expect(notificationsService.createNotification).not.toHaveBeenCalled();
  });

  it('blocks a banned course from being moved to an instructor-managed status other than review', async () => {
    courseRepository.findOne.mockResolvedValueOnce({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'BANNED',
    } as KhoaHoc);

    await expect(service.updateCourseStatus(11, 99, 'ARCHIVED')).rejects.toThrow(
      'đình chỉ',
    );
  });

  it('allows a banned course to be resubmitted for review after remediation', async () => {
    courseRepository.findOne.mockResolvedValueOnce({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'BANNED',
    } as KhoaHoc);
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'Bài 1', aiStatus: 'APPROVED' },
    ]);

    await expect(service.updateCourseStatus(11, 99, 'PENDING')).resolves.toEqual(
      expect.objectContaining({ trangThai: 'PENDING' }),
    );
  });

  it('allows a rejected course to be resubmitted for review after editing', async () => {
    courseRepository.findOne.mockResolvedValueOnce({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'REJECTED',
    } as KhoaHoc);
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'Bai 1', aiStatus: 'APPROVED' },
    ]);

    await expect(
      service.updateCourseStatus(11, 99, 'PENDING'),
    ).resolves.toEqual(expect.objectContaining({ trangThai: 'PENDING' }));
  });

  it('blocks deletion of a banned course', async () => {
    courseRepository.findOne.mockResolvedValueOnce({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'BANNED',
    } as KhoaHoc);

    await expect(service.remove(11, 99)).rejects.toThrow('đình chỉ');
    expect(courseRepository.update).not.toHaveBeenCalled();
  });

  it('returns the latest ban reason with the instructor course detail', async () => {
    courseRepository.findOne.mockResolvedValueOnce({
      maKH: 11,
      maND_GiangVien: 99,
      trangThai: 'BANNED',
    } as KhoaHoc);
    dataSource.query
      .mockResolvedValueOnce([{ NoiDung: 'Mục tiêu 1' }])
      .mockResolvedValueOnce([{ NoiDung: 'Yêu cầu 1' }])
      .mockResolvedValueOnce([{ GhiChu: 'Video bài 3 vi phạm bản quyền.' }]);

    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.getCourseById(11, 99)).resolves.toEqual(
      expect.objectContaining({
        banReason: 'Video bài 3 vi phạm bản quyền.',
        muc_tieu: ['Mục tiêu 1'],
        yeu_cau: ['Yêu cầu 1'],
      }),
    );
  });

  it('requires an appeal when a lesson video was rejected by AI', async () => {
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'B?i 1', aiStatus: 'APPROVED' },
      { maBH: 2, tenBaiHoc: 'B?i 2', aiStatus: 'APPROVED' },
      { maBH: 3, tenBaiHoc: 'B?i 3', aiStatus: 'APPROVED' },
      { maBH: 4, tenBaiHoc: 'B?i 4', aiStatus: 'NEEDS_REVIEW' },
      { maBH: 5, tenBaiHoc: 'B?i 5', aiStatus: 'REJECTED' },
    ]);

    await expect(service.updateCourseStatus(11, 99, 'PENDING')).rejects.toMatchObject({
      response: expect.objectContaining({
        errorCode: 'HAS_AI_REJECTED_LESSONS',
      }),
    });
  });

  it('records a pending appeal when rejected lessons are appealed with a reason', async () => {
    dataSource.query.mockResolvedValueOnce([
      { maBH: 1, tenBaiHoc: 'B?i 1', aiStatus: 'APPROVED' },
      { maBH: 2, tenBaiHoc: 'B?i 2', aiStatus: 'NEEDS_REVIEW' },
      { maBH: 3, tenBaiHoc: 'B?i 3', aiStatus: 'NEEDS_REVIEW' },
      { maBH: 4, tenBaiHoc: 'B?i 4', aiStatus: 'REJECTED' },
      { maBH: 5, tenBaiHoc: 'B?i 5', aiStatus: 'REJECTED' },
    ]);

    await expect(service.updateCourseStatus(11, 99, 'PENDING', {
      isAppealing: true,
      appealReason: 'Video la noi dung giang day hop le',
    })).resolves.toEqual(
      expect.objectContaining({
        id: 11,
        trangThai: 'PENDING_APPEAL',
        reviewCount: 2,
        totalVideoLessons: 5,
      }),
    );

    expect(courseRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        trangThai: 'PENDING_APPEAL',
        isAppealing: true,
      }),
    );
  });
});
