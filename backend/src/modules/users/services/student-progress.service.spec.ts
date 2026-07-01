import { StudentProgressService } from './student-progress.service';

describe('StudentProgressService', () => {
  const dataSource = {
    query: jest.fn(),
  };

  const service = new StudentProgressService(dataSource as never);

  beforeEach(() => {
    dataSource.query.mockReset();
  });

  it('marks an existing lesson progress row as complete', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaTienDo: 14 }])
      .mockResolvedValueOnce([]);

    await expect(service.markLessonComplete(7, 55)).resolves.toEqual({
      success: true,
    });

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      'SELECT MaTienDo FROM TienDoHocTap WHERE MaND = ? AND MaBH = ?',
      [7, 55],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE TienDoHocTap SET DaHoanThanh = 1, LanXemCuoi = NOW() WHERE MaTienDo = ?',
      [14],
    );
  });

  it('returns completed lesson ids for the student', async () => {
    dataSource.query.mockResolvedValueOnce([{ MaBH: 11 }, { MaBH: 12 }]);

    await expect(service.getMyProgress(7)).resolves.toEqual([11, 12]);
  });
});
