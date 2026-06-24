import { Test, TestingModule } from '@nestjs/testing';

import { DiscussionsController } from './controllers/discussions.controller';
import { DiscussionsService } from './services/discussions.service';

describe('DiscussionsController', () => {
  let controller: DiscussionsController;
  let service: {
    getInstructorDiscussions: jest.Mock;
    getCourseDiscussions: jest.Mock;
    replyToDiscussion: jest.Mock;
    deleteOwnDiscussion: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getInstructorDiscussions: jest.fn(),
      getCourseDiscussions: jest.fn(),
      replyToDiscussion: jest.fn(),
      deleteOwnDiscussion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscussionsController],
      providers: [{ provide: DiscussionsService, useValue: service }],
    }).compile();

    controller = module.get<DiscussionsController>(DiscussionsController);
  });

  it('returns instructor course discussions', async () => {
    const discussions = [
      {
        discussionId: 1,
        content: 'Câu hỏi mẫu',
        parentId: null,
        courseId: 100,
        courseTitle: 'React căn bản',
      },
    ];
    service.getInstructorDiscussions.mockResolvedValue(discussions);

    await expect(
      controller.getInstructorDiscussions({ user: { sub: 30001 } } as any),
    ).resolves.toEqual({
      message: 'Lấy danh sách hỏi đáp khóa học thành công',
      data: discussions,
    });
    expect(service.getInstructorDiscussions).toHaveBeenCalledWith(30001);
  });

  it('replies to a course discussion', async () => {
    const reply = {
      discussionId: 2,
      content: 'Câu trả lời mẫu',
      parentId: 1,
      courseId: 100,
      courseTitle: 'React căn bản',
    };
    service.replyToDiscussion.mockResolvedValue(reply);

    await expect(
      controller.replyToDiscussion(
        '100',
        { user: { sub: 30001 } } as any,
        { parentId: 1, noiDung: 'Câu trả lời mẫu' },
      ),
    ).resolves.toEqual({
      message: 'Gửi phản hồi thảo luận thành công',
      data: reply,
    });
    expect(service.replyToDiscussion).toHaveBeenCalledWith(100, 30001, {
      parentId: 1,
      noiDung: 'Câu trả lời mẫu',
    });
  });

  it('deletes an instructor owned discussion comment', async () => {
    service.deleteOwnDiscussion.mockResolvedValue({ deleted: true });

    await expect(
      controller.deleteOwnDiscussion('2', { user: { sub: 30001 } } as any),
    ).resolves.toEqual({
      message: 'Xóa bình luận hỏi đáp thành công',
      data: { deleted: true },
    });
    expect(service.deleteOwnDiscussion).toHaveBeenCalledWith(2, 30001);
  });
});
