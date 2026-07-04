import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

/** Loại lý do báo cáo */
export type ReportReason =
  | 'SPAM'
  | 'HATE_SPEECH'
  | 'HARASSMENT'
  | 'FALSE_INFO'
  | 'OTHER';

/** Hành động Admin thực hiện khi xử lý báo cáo */
export type ResolveAction =
  | 'HIDE_COMMENT'
  | 'WARN_USER'
  | 'BLOCK_USER'
  | 'REJECT';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  // ─── Gửi báo cáo vi phạm ───────────────────────────────────────────────────
  async createReport(
    reporterId: number,
    discussionId: number | null,
    reportedUserId: number,
    reason: ReportReason,
    details?: string,
  ) {
    // Kiểm tra người bị báo cáo tồn tại
    const userCheck = await this.dataSource.query(
      `SELECT MaND FROM NguoiDung WHERE MaND = ?`,
      [reportedUserId],
    );

    if (userCheck.length === 0) {
      throw new BadRequestException('Người dùng bị báo cáo không tồn tại');
    }

    const maBaoCao = uuidv4();

    await this.dataSource.query(
      `INSERT INTO BaoCaoViPham (MaBaoCao, MaNguoiBaoCao, MaThaoLuan, MaUserBiBaoCao, LyDo, ChiTiet)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        maBaoCao,
        reporterId,
        discussionId,
        reportedUserId,
        reason,
        details || null,
      ],
    );

    // --- Thông báo cho Giảng viên ---
    if (discussionId) {
      try {
        // Lấy thông tin Giảng viên (MaND_GiangVien), Tên khóa học và Tên người báo cáo
        const query = `
          SELECT 
            kh.MaND_GiangVien, 
            kh.TenKhoaHoc, 
            nd.HoTen AS ReporterName
          FROM ThaoLuanKhoaHoc tl
          JOIN KhoaHoc kh ON tl.MaKH = kh.MaKH
          JOIN NguoiDung nd ON nd.MaND = ?
          WHERE tl.MaThaoLuan = ?
        `;
        const result = await this.dataSource.query(query, [
          reporterId,
          discussionId,
        ]);

        if (result && result.length > 0) {
          const instructorId = result[0].MaND_GiangVien;
          const courseName = result[0].TenKhoaHoc;
          const reporterName = result[0].ReporterName;

          const reasonLabels: Record<ReportReason, string> = {
            SPAM: 'Spam',
            HATE_SPEECH: 'Ngôn từ thù địch',
            HARASSMENT: 'Quấy rối',
            FALSE_INFO: 'Thông tin sai sự thật',
            OTHER: 'Lý do khác',
          };

          const reasonText = reasonLabels[reason] || 'Khác';
          const notificationTitle = 'Bình luận hỏi đáp bị báo cáo';
          const notificationBody = `Học viên ${reporterName} đã báo cáo một bình luận hỏi đáp trong khóa học "${courseName}" với lý do: ${reasonText}.`;

          await this.dataSource.query(
            `INSERT INTO ThongBao (MaND, LoaiThongBao, TieuDe, NoiDung, DaDoc, MaNguoiGui)
             VALUES (?, 'COURSE', ?, ?, 0, ?)`,
            [instructorId, notificationTitle, notificationBody, reporterId],
          );
        }
      } catch (err) {
        console.error('Lỗi khi gửi thông báo cho giảng viên:', err);
      }
    }

    return { reportId: maBaoCao, message: 'Đã gửi báo cáo thành công' };
  }

  // ─── Lấy danh sách báo cáo (Admin) ────────────────────────────────────────
  async getReports(status: string | undefined, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const whereClause = status ? `WHERE bc.TrangThai = ?` : '';
    const params: any[] = status ? [status, limit, offset] : [limit, offset];

    const reports = await this.dataSource.query(
      `
      SELECT
        bc.MaBaoCao AS reportId,
        bc.LyDo AS reason,
        bc.ChiTiet AS details,
        bc.TrangThai AS status,
        bc.GhiChuAdmin AS adminNotes,
        bc.NgayTao AS createdAt,
        bc.MaThaoLuan AS discussionId,
        tl.NoiDung AS commentContent,
        reporter.MaND AS reporterId,
        reporter.HoTen AS reporterName,
        reporter.AnhDaiDien AS reporterAvatar,
        reported.MaND AS reportedUserId,
        reported.HoTen AS reportedUserName,
        reported.AnhDaiDien AS reportedUserAvatar,
        reported.ViolationCount AS violationCount,
        reported.AccountStatus AS accountStatus
      FROM BaoCaoViPham bc
      INNER JOIN NguoiDung reporter ON bc.MaNguoiBaoCao = reporter.MaND
      INNER JOIN NguoiDung reported ON bc.MaUserBiBaoCao = reported.MaND
      LEFT JOIN ThaoLuanKhoaHoc tl ON bc.MaThaoLuan = tl.MaThaoLuan
      ${whereClause}
      ORDER BY bc.NgayTao DESC
      LIMIT ? OFFSET ?
      `,
      params,
    );

    // Đếm tổng số bản ghi để phân trang
    const countParams: any[] = status ? [status] : [];
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM BaoCaoViPham bc ${whereClause}`,
      countParams,
    );
    const total = parseInt(countResult[0]?.total ?? '0', 10);

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Xử lý báo cáo (Admin) ────────────────────────────────────────────────
  async resolveReport(reportId: string, action: ResolveAction, notes?: string) {
    // Lấy thông tin báo cáo
    const reportRows = await this.dataSource.query(
      `SELECT MaBaoCao, MaThaoLuan, MaUserBiBaoCao, TrangThai FROM BaoCaoViPham WHERE MaBaoCao = ?`,
      [reportId],
    );

    if (reportRows.length === 0) {
      throw new NotFoundException('Không tìm thấy báo cáo này');
    }

    const report = reportRows[0];

    if (report.TrangThai === 'RESOLVED') {
      throw new BadRequestException('Báo cáo này đã được xử lý trước đó');
    }

    // Thực thi hành động theo action
    if (action === 'HIDE_COMMENT') {
      if (!report.MaThaoLuan) {
        throw new BadRequestException(
          'Báo cáo này không liên kết với bình luận nào',
        );
      }
      await this.dataSource.query(
        `UPDATE ThaoLuanKhoaHoc SET IsHidden = TRUE WHERE MaThaoLuan = ?`,
        [report.MaThaoLuan],
      );
    }

    if (action === 'WARN_USER' || action === 'BLOCK_USER') {
      const userId = report.MaUserBiBaoCao;

      if (action === 'WARN_USER') {
        // Tăng ViolationCount và cập nhật AccountStatus
        await this.dataSource.query(
          `UPDATE NguoiDung SET ViolationCount = ViolationCount + 1, AccountStatus = 'WARNED' WHERE MaND = ?`,
          [userId],
        );

        // Kiểm tra nếu >= 3 lần vi phạm → tự động BLOCK
        const userRow = await this.dataSource.query(
          `SELECT ViolationCount FROM NguoiDung WHERE MaND = ?`,
          [userId],
        );

        if (userRow[0]?.ViolationCount >= 3) {
          await this.dataSource.query(
            `UPDATE NguoiDung SET AccountStatus = 'BLOCKED' WHERE MaND = ?`,
            [userId],
          );
        }
      } else {
        // BLOCK_USER trực tiếp
        await this.dataSource.query(
          `UPDATE NguoiDung SET AccountStatus = 'BLOCKED' WHERE MaND = ?`,
          [userId],
        );
      }

      // --- Push Notification bằng Firebase Admin ---
      try {
        // Lấy fcmToken của người bị báo cáo
        const fcmQuery = await this.dataSource.query(
          `SELECT fcmToken FROM NguoiDung WHERE MaND = ?`,
          [userId],
        );

        const fcmToken = fcmQuery[0]?.fcmToken;

        if (fcmToken) {
          // Initialize Firebase Admin nếu chưa setup (tùy thuộc vào config hiện tại)
          if (!getApps().length) {
            initializeApp();
          }

          let title = '';
          let body = '';

          if (action === 'WARN_USER') {
            title = 'Cảnh cáo vi phạm ⚠️';
            body =
              'Bình luận của bạn vi phạm tiêu chuẩn cộng đồng. Hệ thống đã ghi nhận 1 lần cảnh cáo.';
          } else if (action === 'BLOCK_USER') {
            title = 'Tài khoản bị khóa ⛔';
            body = 'Tài khoản của bạn đã bị khóa do vi phạm nghiêm trọng.';
          }

          await getMessaging().send({
            token: fcmToken,
            notification: {
              title,
              body,
            },
          });
        }
      } catch (pushError) {
        // Lỗi gửi thông báo cũng không làm vỡ luồng xử lý báo cáo chính
        console.error('Lỗi khi gửi Push Notification:', pushError);
      }
    }

    if (action === 'REJECT') {
      // Từ chối báo cáo, không làm gì thêm
      await this.dataSource.query(
        `UPDATE BaoCaoViPham SET TrangThai = 'REJECTED', GhiChuAdmin = ? WHERE MaBaoCao = ?`,
        [notes || null, reportId],
      );
      return { resolved: true, action: 'REJECTED' };
    }

    // Cập nhật trạng thái báo cáo thành RESOLVED
    await this.dataSource.query(
      `UPDATE BaoCaoViPham SET TrangThai = 'RESOLVED', GhiChuAdmin = ? WHERE MaBaoCao = ?`,
      [notes || null, reportId],
    );

    return { resolved: true, action };
  }
}
