import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { InstructorQuizQuestionsService } from './services/instructor-quiz-questions.service';

describe('InstructorQuizQuestionsService', () => {
  let service: InstructorQuizQuestionsService;
  let dataSource: { query: jest.Mock };

  const payload = {
    noiDung: 'TypeScript là gì?',
    dapAnA: 'Ngôn ngữ lập trình',
    dapAnB: 'Cơ sở dữ liệu',
    dapAnC: 'Hệ điều hành',
    dapAnD: 'Trình duyệt',
    dapAnDung: 'A' as const,
    thuTu: 1,
  };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorQuizQuestionsService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(InstructorQuizQuestionsService);
  });

  it('lists questions for an owned chapter in order', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5 }])
      .mockResolvedValueOnce([
        { maCauHoi: 2, maChuong: 5, thuTu: 2 },
        { maCauHoi: 1, maChuong: 5, thuTu: 1 },
      ]);

    await expect(service.listByChapter(5, 7)).resolves.toEqual([
      { maCauHoi: 2, maChuong: 5, thuTu: 2 },
      { maCauHoi: 1, maChuong: 5, thuTu: 1 },
    ]);
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('KhoaHoc'),
      [5, 7],
    );
  });

  it('creates a question only after verifying chapter ownership', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5 }])
      .mockResolvedValueOnce([{ maCauHoi: 9 }]);

    await expect(service.create(5, 7, payload)).resolves.toEqual({
      maCauHoi: 9,
      maChuong: 5,
      ...payload,
    });
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO CauHoiTracNghiem'),
      [
        5,
        payload.noiDung,
        payload.dapAnA,
        payload.dapAnB,
        payload.dapAnC,
        payload.dapAnD,
        payload.dapAnDung,
        payload.thuTu,
      ],
    );
  });

  it('rejects operations on a chapter outside instructor ownership', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.listByChapter(5, 7)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects update when the question does not belong to the chapter', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5 }])
      .mockResolvedValueOnce([]);

    await expect(
      service.update(5, 9, 7, { noiDung: 'Nội dung mới' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates and deletes an owned question', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ maChuong: 5 }])
      .mockResolvedValueOnce([
        {
          maCauHoi: 9,
          maChuong: 5,
          noiDung: payload.noiDung,
          dapAnA: payload.dapAnA,
          dapAnB: payload.dapAnB,
          dapAnC: payload.dapAnC,
          dapAnD: payload.dapAnD,
          dapAnDung: payload.dapAnDung,
          thuTu: payload.thuTu,
        },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ maChuong: 5 }])
      .mockResolvedValueOnce([{ maCauHoi: 9, maChuong: 5 }])
      .mockResolvedValueOnce(undefined);

    const updateDto = { dapAnDung: 'C' as QuizAnswerKey };
    await expect(service.update(5, 9, 7, updateDto)).resolves.toEqual(
      expect.objectContaining({ maCauHoi: 9, maChuong: 5, dapAnDung: 'C' }),
    );
    await expect(service.remove(5, 9, 7)).resolves.toBeUndefined();
    expect(dataSource.query).toHaveBeenLastCalledWith(
      expect.stringContaining('DELETE FROM CauHoiTracNghiem'),
      [9, 5],
    );
  });
});
