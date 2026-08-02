import { Test, TestingModule } from '@nestjs/testing';

import { QuizQuestionsController } from './controllers/quiz-questions.controller';
import { QuizQuestionsService } from './services/quiz-questions.service';

describe('QuizQuestionsController', () => {
  let controller: QuizQuestionsController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      listByChapter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizQuestionsController],
      providers: [{ provide: QuizQuestionsService, useValue: service }],
    }).compile();

    controller = module.get(QuizQuestionsController);
  });

  it('forwards list request with current instructor', async () => {
    service.listByChapter.mockResolvedValue([]);

    await expect(controller.list('5', { user: { sub: 7 } })).resolves.toEqual({
      message: 'Lấy danh sách câu hỏi thành công',
      data: [],
    });
    expect(service.listByChapter).toHaveBeenCalledWith(5, 7);
  });

  it('forwards create, update and delete requests', async () => {
    const body = { noiDung: 'Q' };
    service.create.mockResolvedValue({ maCauHoi: 1 });
    service.update.mockResolvedValue({ maCauHoi: 1 });
    service.remove.mockResolvedValue(undefined);

    await controller.create('5', { user: { sub: 7 } }, body);
    await controller.update('5', '1', { user: { sub: 7 } }, body);
    await controller.remove('5', '1', { user: { sub: 7 } });

    expect(service.create).toHaveBeenCalledWith(5, 7, body);
    expect(service.update).toHaveBeenCalledWith(5, 1, 7, body);
    expect(service.remove).toHaveBeenCalledWith(5, 1, 7);
  });
});
