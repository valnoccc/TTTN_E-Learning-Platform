import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ForumAdminQuestionFilter {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ForumAdminTag {
  maThe: number;
  tenThe: string;
  duongDan: string;
}

export interface ForumAdminQuestionItem {
  maCH: number;
  tieuDe: string;
  noiDung: string;
  noiDungTomTat: string;
  luotXem: number;
  luotBinhChon: number;
  soCauTraLoi: number;
  ngayTao: string;
  ngayCapNhat: string;
  tacGia: {
    maND: number;
    hoTen: string;
    anhDaiDien: string | null;
  };
  danhSachThe: ForumAdminTag[];
}

export interface ForumAdminQuestionBoard {
  data: ForumAdminQuestionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalQuestions: number;
    totalReplies: number;
    totalViews: number;
  };
}

type RawForumQuestionRow = {
  maCH: number | string;
  tieuDe: string;
  noiDung: string;
  luotXem: number | string | null;
  luotBinhChon: number | string | null;
  soCauTraLoi: number | string | null;
  ngayTao: string | Date;
  ngayCapNhat: string | Date;
  tacGiaId: number | string;
  tacGiaHoTen: string;
  tacGiaAnhDaiDien: string | null;
};

type RawForumTagRow = {
  maCH: number | string;
  maThe: number | string;
  tenThe: string;
  duongDan: string;
};

@Injectable()
export class ForumAdminService {
  constructor(private readonly dataSource: DataSource) {}

  async listRootQuestions(
    filter: ForumAdminQuestionFilter = {},
  ): Promise<ForumAdminQuestionBoard> {
    const page = Math.max(Number(filter.page ?? 1) || 1, 1);
    const limit = Math.min(Math.max(Number(filter.limit ?? 20) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const searchTerm = String(filter.search ?? '').trim();
    const searchParams: Array<string> = [];

    let searchSql = '';
    if (searchTerm) {
      const keyword = `%${searchTerm}%`;
      searchSql = `
        AND (
          ch.TieuDe LIKE ?
          OR ch.NoiDung LIKE ?
          OR nd.HoTen LIKE ?
          OR EXISTS (
            SELECT 1
            FROM CauHoi_TheTu ctt
            INNER JOIN TheTuDienDan tt ON tt.MaThe = ctt.MaThe
            WHERE ctt.MaCH = ch.MaCH AND tt.TenThe LIKE ?
          )
        )
      `;
      searchParams.push(keyword, keyword, keyword, keyword);
    }

    const countRows = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM CauHoiDienDan ch
        INNER JOIN NguoiDung nd ON nd.MaND = ch.MaND
        WHERE 1 = 1
        ${searchSql}
      `,
      searchParams,
    );

    const total = Number(countRows[0]?.total ?? 0);

    const rows: RawForumQuestionRow[] = await this.dataSource.query(
      `
        SELECT
          ch.MaCH AS maCH,
          ch.TieuDe AS tieuDe,
          ch.NoiDung AS noiDung,
          ch.LuotXem AS luotXem,
          ch.LuotBinhChon AS luotBinhChon,
          ch.SoCauTraLoi AS soCauTraLoi,
          ch.NgayTao AS ngayTao,
          ch.NgayCapNhat AS ngayCapNhat,
          nd.MaND AS tacGiaId,
          nd.HoTen AS tacGiaHoTen,
          nd.AnhDaiDien AS tacGiaAnhDaiDien
        FROM CauHoiDienDan ch
        INNER JOIN NguoiDung nd ON nd.MaND = ch.MaND
        WHERE 1 = 1
        ${searchSql}
        ORDER BY ch.NgayTao DESC
        LIMIT ? OFFSET ?
      `,
      [...searchParams, limit, offset],
    );

    const questionIds = rows.map((row) => Number(row.maCH));
    const tagRows: RawForumTagRow[] =
      questionIds.length > 0
        ? await this.dataSource.query(
            `
              SELECT
                ctt.MaCH AS maCH,
                tt.MaThe AS maThe,
                tt.TenThe AS tenThe,
                tt.DuongDan AS duongDan
              FROM CauHoi_TheTu ctt
              INNER JOIN TheTuDienDan tt ON tt.MaThe = ctt.MaThe
              WHERE ctt.MaCH IN (${questionIds.map(() => '?').join(',')})
              ORDER BY tt.TenThe ASC
            `,
            questionIds,
          )
        : [];

    const tagsByQuestionId = new Map<number, ForumAdminTag[]>();
    tagRows.forEach((row) => {
      const questionId = Number(row.maCH);
      const current = tagsByQuestionId.get(questionId) ?? [];
      current.push({
        maThe: Number(row.maThe),
        tenThe: row.tenThe,
        duongDan: row.duongDan,
      });
      tagsByQuestionId.set(questionId, current);
    });

    const summaryRows = await this.dataSource.query(
      `
        SELECT
          COUNT(*) AS totalQuestions,
          COALESCE(SUM(SoCauTraLoi), 0) AS totalReplies,
          COALESCE(SUM(LuotXem), 0) AS totalViews
        FROM CauHoiDienDan
      `,
    );

    const summary = {
      totalQuestions: Number(summaryRows[0]?.totalQuestions ?? 0),
      totalReplies: Number(summaryRows[0]?.totalReplies ?? 0),
      totalViews: Number(summaryRows[0]?.totalViews ?? 0),
    };

    return {
      data: rows.map((row) => ({
        maCH: Number(row.maCH),
        tieuDe: row.tieuDe,
        noiDung: row.noiDung,
        noiDungTomTat: this.createPreview(row.noiDung),
        luotXem: Number(row.luotXem ?? 0),
        luotBinhChon: Number(row.luotBinhChon ?? 0),
        soCauTraLoi: Number(row.soCauTraLoi ?? 0),
        ngayTao: new Date(row.ngayTao).toISOString(),
        ngayCapNhat: new Date(row.ngayCapNhat).toISOString(),
        tacGia: {
          maND: Number(row.tacGiaId),
          hoTen: row.tacGiaHoTen,
          anhDaiDien: row.tacGiaAnhDaiDien,
        },
        danhSachThe: tagsByQuestionId.get(Number(row.maCH)) ?? [],
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary,
    };
  }

  async deleteQuestion(questionId: number) {
    const questionRows = await this.dataSource.query(
      `
        SELECT MaCH, TieuDe
        FROM CauHoiDienDan
        WHERE MaCH = ?
        LIMIT 1
      `,
      [questionId],
    );

    if (questionRows.length === 0) {
      throw new NotFoundException('Không tìm thấy bài đăng diễn đàn.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM CauHoi_TheTu WHERE MaCH = ?', [
        questionId,
      ]);
      await manager.query('DELETE FROM CauHoiDienDan WHERE MaCH = ?', [
        questionId,
      ]);
    });

    return {
      deleted: true,
      questionId,
      title: questionRows[0].TieuDe as string,
    };
  }

  private createPreview(content: string, maxLength = 180) {
    const plainText = String(content ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) {
      return 'Không có nội dung.';
    }

    return plainText.length > maxLength
      ? `${plainText.slice(0, maxLength).trim()}...`
      : plainText;
  }
}
