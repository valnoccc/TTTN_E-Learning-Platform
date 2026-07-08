import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { ForumAdminService } from './forum-admin.service';

describe('ForumAdminService', () => {
  let service: ForumAdminService;
  let dataSource: {
    query: jest.Mock;
    transaction: jest.Mock;
  };
  let manager: {
    query: jest.Mock;
  };

  beforeEach(async () => {
    manager = {
      query: jest.fn(),
    };

    dataSource = {
      query: jest.fn(),
      transaction: jest.fn(async (callback: (transactionManager: typeof manager) => Promise<unknown>) =>
        callback(manager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumAdminService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get(ForumAdminService);
  });

  it('lists root questions with tags and summary data', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([
        {
          maCH: 7,
          tieuDe: 'Câu hỏi mẫu',
          noiDung: '<p>Xin <strong>chào</strong> diễn đàn</p>',
          luotXem: '12',
          luotBinhChon: '3',
          soCauTraLoi: '4',
          ngayTao: '2026-07-07T01:02:03.000Z',
          ngayCapNhat: '2026-07-07T04:05:06.000Z',
          tacGiaId: 99,
          tacGiaHoTen: 'Nguyễn Văn A',
          tacGiaAnhDaiDien: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          maCH: 7,
          maThe: 11,
          tenThe: 'NestJS',
          duongDan: 'nestjs',
        },
      ])
      .mockResolvedValueOnce([
        {
          totalQuestions: '2',
          totalReplies: '4',
          totalViews: '12',
        },
      ]);

    const result = await service.listRootQuestions({
      search: 'diễn đàn',
      page: 1,
      limit: 20,
    });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.summary).toEqual({
      totalQuestions: 2,
      totalReplies: 4,
      totalViews: 12,
    });
    expect(result.data[0]).toMatchObject({
      maCH: 7,
      tieuDe: 'Câu hỏi mẫu',
      noiDungTomTat: 'Xin chào diễn đàn',
      luotXem: 12,
      luotBinhChon: 3,
      soCauTraLoi: 4,
      tacGia: {
        maND: 99,
        hoTen: 'Nguyễn Văn A',
        anhDaiDien: null,
      },
      danhSachThe: [
        {
          maThe: 11,
          tenThe: 'NestJS',
          duongDan: 'nestjs',
        },
      ],
    });
  });

  it('deletes a root question after checking existence', async () => {
    dataSource.query.mockResolvedValueOnce([{ MaCH: 7, TieuDe: 'Topic 7' }]);
    manager.query.mockResolvedValueOnce({ affectedRows: 1 }).mockResolvedValueOnce({
      affectedRows: 1,
    });

    const result = await service.deleteQuestion(7);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT MaCH, TieuDe'),
      [7],
    );
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('DELETE FROM CauHoi_TheTu'),
      [7],
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM CauHoiDienDan'),
      [7],
    );
    expect(result).toEqual({
      deleted: true,
      questionId: 7,
      title: 'Topic 7',
    });
  });

  it('throws when deleting a missing question', async () => {
    dataSource.query.mockResolvedValueOnce([]);

    await expect(service.deleteQuestion(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
