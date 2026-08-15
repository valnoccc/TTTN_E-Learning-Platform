import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type CreateWithdrawalRequestInput = { soTien: number };

export type WithdrawalRequestCreated = {
  requestId: number;
  amount: number;
  status: 'PENDING';
};

export type InstructorWithdrawalRequest = {
  requestId: number;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  createdAt: Date;
  processedAt: Date | null;
  rejectionReason: string | null;
  transactionCode: string | null;
};

export type AdminWithdrawalRequest = InstructorWithdrawalRequest & {
  instructorName: string;
  accountHolder: string;
};

export type PaginatedWithdrawalRequests = {
  items: AdminWithdrawalRequest[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type BankProfileRow = {
  SoTaiKhoan?: string | null;
  MaNganHang?: string | null;
  TenNganHang?: string | null;
  TenChuTaiKhoan?: string | null;
};

type WalletForUpdateRow = {
  MaVi: number | string;
  SoDuKhaDung: number | string | null;
  SoDuDangRut: number | string | null;
};

@Injectable()
export class WithdrawalsService {
  constructor(private readonly dataSource: DataSource) {}

  async createRequest(
    userId: number,
    input: CreateWithdrawalRequestInput,
  ): Promise<WithdrawalRequestCreated> {
    const amount = this.toMoney(input.soTien);
    if (amount <= 0) {
      throw new BadRequestException('Số tiền rút phải lớn hơn 0.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const profiles = (await queryRunner.query(
        `SELECT SoTaiKhoan, MaNganHang, TenNganHang, TenChuTaiKhoan
         FROM HoSoGiangVien WHERE MaND = ? LIMIT 1`,
        [userId],
      )) as BankProfileRow[];
      const profile = profiles[0];
      if (!this.hasPaymentInformation(profile)) {
        throw new BadRequestException(
          'Vui lòng cập nhật đầy đủ thông tin nhận tiền trước khi rút.',
        );
      }

      const wallets = (await queryRunner.query(
        `SELECT MaVi, SoDuKhaDung, SoDuDangRut
         FROM ViGiangVien WHERE MaND = ? FOR UPDATE`,
        [userId],
      )) as WalletForUpdateRow[];
      const wallet = wallets[0];
      if (!wallet) {
        throw new BadRequestException('Bạn chưa có số dư khả dụng để rút.');
      }

      const availableBefore = this.toMoney(wallet.SoDuKhaDung);
      const pendingBefore = this.toMoney(wallet.SoDuDangRut);
      if (amount > availableBefore) {
        throw new BadRequestException('Số tiền rút vượt quá số dư khả dụng.');
      }

      const availableAfter = availableBefore - amount;
      const pendingAfter = pendingBefore + amount;

      await queryRunner.query(
        `UPDATE ViGiangVien
         SET SoDuKhaDung = SoDuKhaDung - ?,
             SoDuDangRut = SoDuDangRut + ?
         WHERE MaND = ?`,
        [amount, amount, userId],
      );

      const requestResult = await queryRunner.query(
        `INSERT INTO YeuCauRutTien
          (MaVi, MaND, SoTien, SoDuKhaDungTruoc, SoDuKhaDungSau,
           SoTaiKhoan, MaNganHang, TenNganHang, TenChuTaiKhoan, TrangThai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          Number(wallet.MaVi),
          userId,
          amount,
          availableBefore,
          availableAfter,
          profile.SoTaiKhoan,
          profile.MaNganHang,
          profile.TenNganHang,
          profile.TenChuTaiKhoan,
        ],
      );
      const requestId = Number(requestResult.insertId);

      await queryRunner.query(
        `INSERT INTO LichSuGiaoDichViGiangVien
          (MaVi, MaND, LoaiGiaoDich, SoTien,
           SoDuKhaDungTruoc, SoDuKhaDungSau,
           SoDuDangRutTruoc, SoDuDangRutSau,
           MaYeuCauRut, KhoaIdempotency, GhiChu)
         VALUES (?, ?, 'WITHDRAWAL_HOLD', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(wallet.MaVi),
          userId,
          amount,
          availableBefore,
          availableAfter,
          pendingBefore,
          pendingAfter,
          requestId,
          `withdrawal:${requestId}:hold`,
          `Giữ tiền cho yêu cầu rút #${requestId}.`,
        ],
      );

      await queryRunner.commitTransaction();
      return { requestId, amount, status: 'PENDING' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyRequests(userId: number): Promise<InstructorWithdrawalRequest[]> {
    const rows = await this.dataSource.query(
      `SELECT MaYeuCauRut AS requestId, SoTien AS amount, TrangThai AS status,
              TenNganHang AS bankName, SoTaiKhoan AS accountNumber,
              NgayTao AS createdAt, NgayXuLy AS processedAt,
              LyDoTuChoi AS rejectionReason,
              MaGiaoDichNgoaiHeThong AS transactionCode
       FROM YeuCauRutTien
       WHERE MaND = ?
       ORDER BY NgayTao DESC, MaYeuCauRut DESC`,
      [userId],
    );
    return rows.map((row: Record<string, unknown>) => ({
      requestId: Number(row.requestId), amount: this.toMoney(row.amount as string),
      status: String(row.status), bankName: String(row.bankName), accountNumber: String(row.accountNumber),
      createdAt: row.createdAt as Date, processedAt: (row.processedAt as Date | null) ?? null,
      rejectionReason: (row.rejectionReason as string | null) ?? null,
      transactionCode: (row.transactionCode as string | null) ?? null,
    }));
  }

  async getAdminRequests(
    status?: string,
    requestedPage = 1,
    requestedLimit = 20,
  ): Promise<PaginatedWithdrawalRequests> {
    const page = Math.max(1, Math.floor(Number(requestedPage) || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(Number(requestedLimit) || 20)));
    const offset = (page - 1) * limit;
    const where = status ? 'WHERE ycrt.TrangThai = ?' : '';
    const parameters = status ? [status] : [];
    const totalRows = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM YeuCauRutTien ycrt ${where}`,
      parameters,
    );
    const totalItems = this.toMoney(totalRows[0]?.total as string);
    const rows = await this.dataSource.query(
      `SELECT ycrt.MaYeuCauRut AS requestId, ycrt.SoTien AS amount, ycrt.TrangThai AS status,
              ycrt.TenNganHang AS bankName, ycrt.SoTaiKhoan AS accountNumber,
              ycrt.TenChuTaiKhoan AS accountHolder, ycrt.NgayTao AS createdAt,
              ycrt.NgayXuLy AS processedAt, ycrt.LyDoTuChoi AS rejectionReason,
              nd.HoTen AS instructorName
       FROM YeuCauRutTien ycrt INNER JOIN NguoiDung nd ON nd.MaND = ycrt.MaND
       ${where} ORDER BY ycrt.NgayTao DESC, ycrt.MaYeuCauRut DESC
       LIMIT ? OFFSET ?`,
      [...parameters, limit, offset],
    );
    const items = rows.map((row: Record<string, unknown>) => ({
      requestId: Number(row.requestId), amount: this.toMoney(row.amount as string), status: String(row.status),
      bankName: String(row.bankName), accountNumber: String(row.accountNumber), accountHolder: String(row.accountHolder),
      instructorName: String(row.instructorName), createdAt: row.createdAt as Date,
      processedAt: (row.processedAt as Date | null) ?? null, rejectionReason: (row.rejectionReason as string | null) ?? null,
    }));
    return { items, page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
  }

  async getAdminRequestDetail(requestId: number) {
    const rows = await this.dataSource.query(
      `SELECT ycrt.*, nd.HoTen AS instructorName, nd.Email AS instructorEmail,
              nd.SoDienThoai AS instructorPhone, v.SoDuKhaDung, v.SoDuDangRut,
              v.TongDoanhThu, v.TongDaChi, admin.HoTen AS processedByName
       FROM YeuCauRutTien ycrt
       INNER JOIN NguoiDung nd ON nd.MaND = ycrt.MaND
       INNER JOIN ViGiangVien v ON v.MaVi = ycrt.MaVi
       LEFT JOIN NguoiDung admin ON admin.MaND = ycrt.MaAdminXuLy
       WHERE ycrt.MaYeuCauRut = ? LIMIT 1`, [requestId]);
    if (!rows[0]) throw new BadRequestException('Không tìm thấy yêu cầu rút tiền.');
    return rows[0];
  }

  async markProcessing(adminId: number, requestId: number) {
    const result = await this.dataSource.query(
      `UPDATE YeuCauRutTien SET TrangThai='PROCESSING', MaAdminXuLy=?, NgayXuLy=NOW()
       WHERE MaYeuCauRut=? AND TrangThai='PENDING'`, [adminId, requestId]);
    if (Number(result.affectedRows ?? result.affectedRows) === 0) throw new BadRequestException('Yêu cầu không còn ở trạng thái chờ xử lý.');
    return this.getAdminRequestDetail(requestId);
  }

  async rejectRequest(adminId: number, requestId: number, reason: string) {
    if (!reason.trim()) throw new BadRequestException('Vui lòng nhập lý do từ chối.');
    await this.dataSource.transaction(async (manager) => {
      const requests = await manager.query(`SELECT MaVi, MaND, SoTien FROM YeuCauRutTien WHERE MaYeuCauRut=? AND TrangThai='PENDING' FOR UPDATE`, [requestId]);
      const request = requests[0];
      if (!request) throw new BadRequestException('Yêu cầu không thể từ chối.');
      await manager.query(`UPDATE ViGiangVien SET SoDuKhaDung=SoDuKhaDung+?, SoDuDangRut=SoDuDangRut-? WHERE MaVi=?`, [request.SoTien, request.SoTien, request.MaVi]);
      await manager.query(`UPDATE YeuCauRutTien SET TrangThai='REJECTED', LyDoTuChoi=?, MaAdminXuLy=?, NgayXuLy=NOW() WHERE MaYeuCauRut=?`, [reason.trim(), adminId, requestId]);
      await manager.query(`INSERT INTO LichSuGiaoDichViGiangVien (MaVi,MaND,LoaiGiaoDich,SoTien,SoDuKhaDungTruoc,SoDuKhaDungSau,SoDuDangRutTruoc,SoDuDangRutSau,MaYeuCauRut,KhoaIdempotency,GhiChu) SELECT v.MaVi,v.MaND,'WITHDRAWAL_RELEASE',?,v.SoDuKhaDung-?,v.SoDuKhaDung,v.SoDuDangRut+?,v.SoDuDangRut,?, ?, ? FROM ViGiangVien v WHERE v.MaVi=?`, [request.SoTien,request.SoTien,request.SoTien,requestId,`withdrawal:${requestId}:reject`,reason.trim(),request.MaVi]);
    });
    return this.getAdminRequestDetail(requestId);
  }

  async completeRequest(adminId: number, requestId: number, transactionCode: string) {
    if (!transactionCode.trim()) throw new BadRequestException('Vui lòng nhập mã giao dịch.');
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(`SELECT MaVi, SoTien FROM YeuCauRutTien WHERE MaYeuCauRut=? AND TrangThai='PENDING' FOR UPDATE`, [requestId]);
      if (!rows[0]) throw new BadRequestException('Yêu cầu không thể phê duyệt.');
      await manager.query(`UPDATE ViGiangVien SET SoDuDangRut=SoDuDangRut-?, TongDaChi=TongDaChi+? WHERE MaVi=?`, [rows[0].SoTien,rows[0].SoTien,rows[0].MaVi]);
      await manager.query(`UPDATE YeuCauRutTien SET TrangThai='COMPLETED', MaGiaoDichNgoaiHeThong=?, MaAdminXuLy=?, NgayXuLy=NOW() WHERE MaYeuCauRut=?`, [transactionCode.trim(),adminId,requestId]);
    });
    return this.getAdminRequestDetail(requestId);
  }

  private hasPaymentInformation(profile?: BankProfileRow): profile is Required<BankProfileRow> {
    return Boolean(
      profile?.SoTaiKhoan?.trim() &&
        profile.MaNganHang?.trim() &&
        profile.TenNganHang?.trim() &&
        profile.TenChuTaiKhoan?.trim(),
    );
  }

  private toMoney(value: number | string | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
