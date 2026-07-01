import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentPaymentHistoryService {
  constructor(private readonly dataSource: DataSource) {}

  async getMyPayments(userId: number) {
    const payments = await this.dataSource.query(
      `SELECT MaHD as id, NgayLap as date, TongTien as amount, TrangThaiThanhToan as status
       FROM HoaDon
       WHERE MaND = ?
       ORDER BY NgayLap DESC`,
      [userId],
    );
    return payments.map((p: any) => {
      const d = new Date(p.date);
      const normalizedStatus = String(p.status || '').toUpperCase();
      return {
        id: `INV-${p.id}`,
        MaHD: p.id,
        date: d.toISOString().split('T')[0],
        amount: Number(p.amount),
        status:
          normalizedStatus === 'PAID'
            ? 'Success'
            : normalizedStatus === 'CANCELED' ||
                normalizedStatus === 'CANCELLED' ||
                normalizedStatus === 'FAILED'
              ? 'Failed'
              : 'Pending',
      };
    });
  }
}
