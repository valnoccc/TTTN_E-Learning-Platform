import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

type PaidInvoiceCourseRow = {
  courseId: number | string;
  instructorId: number | string;
  amount: number | string | null;
};

type WalletRow = {
  maVi: number | string;
  maND: number | string;
  soDuKhaDung: number | string | null;
  soDuDangRut: number | string | null;
  tongDoanhThu: number | string | null;
  tongDaChi: number | string | null;
};

export type InstructorWalletSummary = {
  walletId: number;
  userId: number;
  availableBalance: number;
  pendingWithdrawalBalance: number;
  totalRevenue: number;
  totalPaidOut: number;
  adminDebt: number;
};

@Injectable()
export class InstructorWalletService {
  constructor(private readonly dataSource: DataSource) {}

  async creditPaidInvoice(invoiceId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceCourses = (await queryRunner.query(
        `SELECT
          cthd.MaKH AS courseId,
          kh.MaND_GiangVien AS instructorId,
          cthd.DoanhThuGiangVien AS amount
        FROM HoaDon hd
        INNER JOIN ChiTietHoaDon cthd ON cthd.MaHD = hd.MaHD
        INNER JOIN KhoaHoc kh ON kh.MaKH = cthd.MaKH
        WHERE hd.MaHD = ? AND hd.TrangThaiThanhToan = 'PAID'`,
        [invoiceId],
      )) as PaidInvoiceCourseRow[];

      for (const invoiceCourse of invoiceCourses) {
        const amount = this.toMoney(invoiceCourse.amount);
        if (amount <= 0) {
          continue;
        }

        const instructorId = Number(invoiceCourse.instructorId);
        const courseId = Number(invoiceCourse.courseId);
        const idempotencyKey = `invoice:${invoiceId}:course:${courseId}:revenue`;

        await queryRunner.query(
          `INSERT INTO ViGiangVien (MaND)
           VALUES (?)
           ON DUPLICATE KEY UPDATE MaND = VALUES(MaND)`,
          [instructorId],
        );

        const wallets = (await queryRunner.query(
          `SELECT
            MaVi AS maVi,
            MaND AS maND,
            SoDuKhaDung AS soDuKhaDung,
            SoDuDangRut AS soDuDangRut,
            TongDoanhThu AS tongDoanhThu,
            TongDaChi AS tongDaChi
           FROM ViGiangVien
           WHERE MaND = ?
           FOR UPDATE`,
          [instructorId],
        )) as WalletRow[];
        const wallet = wallets[0];
        if (!wallet) {
          throw new Error('Không thể khởi tạo ví giảng viên.');
        }

        const existingHistory = await queryRunner.query(
          `SELECT MaLichSu FROM LichSuGiaoDichViGiangVien
           WHERE KhoaIdempotency = ? LIMIT 1`,
          [idempotencyKey],
        );
        if (Array.isArray(existingHistory) && existingHistory.length > 0) {
          continue;
        }

        const availableBefore = this.toMoney(wallet.soDuKhaDung);
        const pendingBefore = this.toMoney(wallet.soDuDangRut);
        const availableAfter = availableBefore + amount;
        await queryRunner.query(
          `UPDATE ViGiangVien
           SET SoDuKhaDung = SoDuKhaDung + ?,
               TongDoanhThu = TongDoanhThu + ?
           WHERE MaND = ?`,
          [amount, amount, instructorId],
        );

        await queryRunner.query(
          `INSERT INTO LichSuGiaoDichViGiangVien
            (MaVi, MaND, LoaiGiaoDich, SoTien,
             SoDuKhaDungTruoc, SoDuKhaDungSau,
             SoDuDangRutTruoc, SoDuDangRutSau,
             MaHoaDon, MaKhoaHoc, KhoaIdempotency, GhiChu)
           VALUES (?, ?, 'REVENUE_CREDIT', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Number(wallet.maVi),
            instructorId,
            amount,
            availableBefore,
            availableAfter,
            pendingBefore,
            pendingBefore,
            invoiceId,
            courseId,
            idempotencyKey,
            `Ghi có doanh thu từ hóa đơn #${invoiceId}.`,
          ],
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getWallet(userId: number): Promise<InstructorWalletSummary> {
    const rows = (await this.dataSource.query(
      `SELECT
        MaVi AS walletId,
        MaND AS userId,
        SoDuKhaDung AS availableBalance,
        SoDuDangRut AS pendingWithdrawalBalance,
        TongDoanhThu AS totalRevenue,
        TongDaChi AS totalPaidOut
       FROM ViGiangVien
       WHERE MaND = ?
       LIMIT 1`,
      [userId],
    )) as Array<Record<string, number | string | null>>;
    const row = rows[0];

    const availableBalance = this.toMoney(row?.availableBalance);
    const pendingWithdrawalBalance = this.toMoney(row?.pendingWithdrawalBalance);

    return {
      walletId: row ? Number(row.walletId) : 0,
      userId,
      availableBalance,
      pendingWithdrawalBalance,
      totalRevenue: this.toMoney(row?.totalRevenue),
      totalPaidOut: this.toMoney(row?.totalPaidOut),
      adminDebt: availableBalance + pendingWithdrawalBalance,
    };
  }

  private toMoney(value: number | string | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
