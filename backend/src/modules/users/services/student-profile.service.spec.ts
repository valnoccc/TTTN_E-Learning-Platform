import { StudentProfileService } from './student-profile.service';

describe('StudentProfileService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new StudentProfileService(dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
  });

  it('returns purchased courses with calculated progress', async () => {
    dataSource.query.mockResolvedValueOnce([
      {
        id: '4',
        title: 'React Basics',
        image: 'https://example.com/react.png',
        progress: '75',
      },
    ]);

    await expect(service.getMyCourses(7)).resolves.toEqual([
      {
        id: 4,
        title: 'React Basics',
        image: 'https://example.com/react.png',
        progress: 75,
      },
    ]);
  });

  it('stores the current lesson for an active enrollment', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.updateCurrentLesson(7, 9, 22)).resolves.toEqual({
      success: true,
      lessonId: 22,
    });

    expect(dataSource.query).toHaveBeenCalledWith(
      `UPDATE DangKyKhoaHoc SET MaBaiHocGanNhat = ? WHERE MaND = ? AND MaKH = ? AND TrangThai = 'ACTIVE'`,
      [22, 7, 9],
    );
  });

  it('returns null when a course has no recorded last lesson', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.getCourseLastLesson(7, 9)).resolves.toEqual({
      lastLessonId: null,
    });
  });
});
