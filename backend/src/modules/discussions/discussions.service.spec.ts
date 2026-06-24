import { DiscussionsService } from './services/discussions.service';

describe('DiscussionsService', () => {
  const repository = {
    findOne: jest.fn(),
  };
  const dataSource = {
    query: jest.fn(),
  };

  let service: DiscussionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DiscussionsService(repository as any, dataSource as any);
  });

  it('loads all discussions for instructor courses', async () => {
    const discussions = [
      {
        discussionId: 1,
        content: 'Câu hỏi mẫu',
        parentId: null,
        courseId: 100,
        courseTitle: 'React căn bản',
      },
    ];
    dataSource.query.mockResolvedValue(discussions);

    await expect(service.getInstructorDiscussions(30001)).resolves.toBe(
      discussions,
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE kh.MaND_GiangVien = ?'),
      [30001],
    );
  });

  it('returns course metadata when instructor replies', async () => {
    repository.findOne.mockResolvedValue({
      maKH: 100,
      tenKhoaHoc: 'React căn bản',
      giangVien: {
        hoTen: 'Thầy Tú',
        anhDaiDien: 'avatar.jpg',
      },
    });
    dataSource.query
      .mockResolvedValueOnce([{ MaThaoLuan: 1 }])
      .mockResolvedValueOnce({ insertId: 2 });

    await expect(
      service.replyToDiscussion(100, 30001, {
        parentId: 1,
        noiDung: 'Câu trả lời mẫu',
      }),
    ).resolves.toMatchObject({
      discussionId: 2,
      content: 'Câu trả lời mẫu',
      parentId: 1,
      userId: 30001,
      courseId: 100,
      courseTitle: 'React căn bản',
    });
  });

  it('deletes only a discussion comment owned by the instructor on their course', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ MaThaoLuan: 2 }])
      .mockResolvedValueOnce({ affectedRows: 1 });

    await expect(service.deleteOwnDiscussion(2, 30001)).resolves.toEqual({
      deleted: true,
    });

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('tl.MaThaoLuan = ?'),
      [2, 30001, 30001],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM ThaoLuanKhoaHoc'),
      [2],
    );
  });

  it('rejects deleting a discussion comment not owned by the instructor', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.deleteOwnDiscussion(2, 30001)).rejects.toThrow(
      'Bạn không có quyền xóa bình luận này',
    );
  });
});
