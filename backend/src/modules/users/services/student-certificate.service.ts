import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StudentCertificateService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Cấp hoặc lấy chứng chỉ hiện có của học viên cho một khóa học.
   * Gọi sau khi học viên hoàn thành toàn bộ bài học.
   * Trả về { certificateId } để Frontend dùng điều hướng.
   */
  async getOrIssueCertificate(
    userId: number,
    courseId: number,
  ): Promise<{ certificateId: string | null }> {
    // 1. Kiểm tra xem đã có chứng chỉ chưa
    const existing = await this.dataSource.query(
      `SELECT MaChungChi FROM ChungChi WHERE MaND = ? AND MaKH = ? LIMIT 1`,
      [userId, courseId],
    );

    if (existing.length > 0) {
      return { certificateId: existing[0].MaChungChi };
    }

    // 1.5. Kiểm tra khóa học có phải miễn phí không
    const courseInfo = await this.dataSource.query(
      `SELECT GiaBan FROM KhoaHoc WHERE MaKH = ? LIMIT 1`,
      [courseId],
    );
    if (courseInfo.length > 0 && Number(courseInfo[0].GiaBan) === 0) {
      // Return null instead of throwing BadRequestException to prevent error toasts on the frontend
      return { certificateId: null };
    }

    // 2. Kiểm tra học viên đã đăng ký khóa học chưa
    const enrolled = await this.dataSource.query(
      `SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND MaKH = ? AND TrangThai = 'ACTIVE' LIMIT 1`,
      [userId, courseId],
    );
    if (enrolled.length === 0) {
      throw new NotFoundException(
        'Bạn chưa đăng ký khóa học này hoặc không đủ điều kiện nhận chứng chỉ.',
      );
    }

    // 3. Kiểm tra hoàn thành toàn bộ bài học
    const lessonProgress = await this.dataSource.query(
      `SELECT COUNT(bh.MaBH) AS totalLessons,
          COUNT(CASE WHEN td.DaHoanThanh = 1 THEN 1 END) AS completedLessons
       FROM BaiHoc bh
       LEFT JOIN TienDoHocTap td ON td.MaBH = bh.MaBH AND td.MaND = ?
       WHERE bh.MaKH = ? AND bh.TrangThai = 'ACTIVE'`,
      [userId, courseId],
    );
    const totalLessons = Number(lessonProgress[0]?.totalLessons ?? 0);
    const completedLessons = Number(lessonProgress[0]?.completedLessons ?? 0);
    if (totalLessons === 0 || completedLessons < totalLessons) {
      throw new BadRequestException(
        'Bạn cần hoàn thành tất cả bài học trước khi nhận chứng chỉ.',
      );
    }

    // 4. Mỗi chương có câu hỏi phải có ít nhất một lần đạt trên 70%.
    // Chương không có câu hỏi được bỏ qua.
    const quizProgress = await this.dataSource.query(
      `SELECT COUNT(DISTINCT ch.MaChuong) AS quizChapters,
          COUNT(DISTINCT CASE WHEN EXISTS (
            SELECT 1 FROM LichSuLamBai lslb
            WHERE lslb.MaND = ? AND lslb.MaChuong = ch.MaChuong
              AND lslb.TrangThai = 'SUBMITTED'
              AND lslb.SoCauDung * 100 > lslb.TongSoCau * 70
          ) THEN ch.MaChuong END) AS passedQuizChapters
       FROM ChuongHoc ch
       INNER JOIN CauHoiTracNghiem c on c.MaChuong = ch.MaChuong
       WHERE ch.MaKH = ?`,
      [userId, courseId],
    );
    const quizChapters = Number(quizProgress[0]?.quizChapters ?? 0);
    const passedQuizChapters = Number(quizProgress[0]?.passedQuizChapters ?? 0);
    if (passedQuizChapters < quizChapters) {
      throw new BadRequestException(
        'Bạn cần đạt trên 70% ở tất cả bài kiểm tra của các chương trước khi nhận chứng chỉ.',
      );
    }

    // 5. Cấp chứng chỉ mới
    const newCertId = uuidv4();
    await this.dataSource.query(
      `INSERT INTO ChungChi (MaChungChi, MaND, MaKH, NgayCap) VALUES (?, ?, ?, NOW())`,
      [newCertId, userId, courseId],
    );

    return { certificateId: newCertId };
  }

  /**
   * Lấy chi tiết chứng chỉ kèm thông tin học viên và khóa học.
   */
  async getCertificateDetail(userId: number, courseId: number) {
    const rows = await this.dataSource.query(
      `SELECT
         c.MaChungChi          AS certificateId,
         c.NgayCap             AS issuedDate,
         u.HoTen               AS studentName,
         u.AnhDaiDien          AS studentAvatar,
         k.TenKhoaHoc          AS courseName,
         k.HinhThuNho          AS thumbnail,
         gv.HoTen              AS instructorName,
         (SELECT AVG(SoSao)
            FROM DanhGiaKhoaHoc
           WHERE MaKH = k.MaKH)                            AS rating,
         (SELECT COUNT(*)
            FROM BaiHoc b
           WHERE b.MaKH = k.MaKH)                         AS totalLessons,
         (SELECT IFNULL(SUM(b2.ThoiLuong), 0)
            FROM BaiHoc b2
           WHERE b2.MaKH = k.MaKH)                        AS totalSeconds
       FROM  ChungChi  c
       JOIN  NguoiDung u  ON c.MaND = u.MaND
       JOIN  KhoaHoc   k  ON c.MaKH = k.MaKH
       JOIN  NguoiDung gv ON k.MaND_GiangVien = gv.MaND
       WHERE c.MaKH = ?
         AND c.MaND = ?
       LIMIT 1`,
      [courseId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException(
        'Chứng chỉ không tồn tại. Vui lòng hoàn thành khóa học trước.',
      );
    }

    const row = rows[0];
    const totalSeconds = Number(row.totalSeconds ?? 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    return {
      certificateId: row.certificateId,
      issuedDate: row.issuedDate,
      studentName: row.studentName,
      studentAvatar: row.studentAvatar ?? null,
      courseName: row.courseName,
      thumbnail: row.thumbnail ?? null,
      instructorName: row.instructorName,
      rating: row.rating ? Number(Number(row.rating).toFixed(1)) : null,
      totalLessons: Number(row.totalLessons ?? 0),
      totalHours,
    };
  }

  /**
   * Lấy chi tiết chứng chỉ theo certificateId (UUID) — dùng khi FE điều hướng sang /certificate/:id.
   */
  async getCertificateById(userId: number, certificateId: string) {
    const rows = await this.dataSource.query(
      `SELECT
         c.MaChungChi          AS certificateId,
         c.NgayCap             AS issuedDate,
         c.MaKH                AS courseId,
         u.HoTen               AS studentName,
         u.AnhDaiDien          AS studentAvatar,
         k.TenKhoaHoc          AS courseName,
         k.HinhThuNho          AS thumbnail,
         gv.HoTen              AS instructorName,
         (SELECT AVG(SoSao)
            FROM DanhGiaKhoaHoc
           WHERE MaKH = k.MaKH)                            AS rating,
         (SELECT COUNT(*)
            FROM BaiHoc b
           WHERE b.MaKH = k.MaKH)                         AS totalLessons,
         (SELECT IFNULL(SUM(b2.ThoiLuong), 0)
            FROM BaiHoc b2
           WHERE b2.MaKH = k.MaKH)                        AS totalSeconds
       FROM  ChungChi  c
       JOIN  NguoiDung u  ON c.MaND = u.MaND
       JOIN  KhoaHoc   k  ON c.MaKH = k.MaKH
       JOIN  NguoiDung gv ON k.MaND_GiangVien = gv.MaND
       WHERE c.MaChungChi = ?
         AND c.MaND       = ?
       LIMIT 1`,
      [certificateId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException(
        'Chứng chỉ không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }

    const row = rows[0];
    const totalSeconds = Number(row.totalSeconds ?? 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    return {
      certificateId: row.certificateId,
      issuedDate: row.issuedDate,
      courseId: Number(row.courseId),
      studentName: row.studentName,
      studentAvatar: row.studentAvatar ?? null,
      courseName: row.courseName,
      thumbnail: row.thumbnail ?? null,
      instructorName: row.instructorName,
      rating: row.rating ? Number(Number(row.rating).toFixed(1)) : null,
      totalLessons: Number(row.totalLessons ?? 0),
      totalHours,
    };
  }

  /**
   * Lấy danh sách tất cả chứng chỉ của học viên, kèm thông tin khóa học.
   * Dùng cho trang "Chứng chỉ của tôi" trong Profile.
   */
  async getMyCertificates(userId: number) {
    const rows = await this.dataSource.query(
      `SELECT
         c.MaChungChi   AS certificateId,
         c.NgayCap      AS issuedDate,
         c.MaKH         AS courseId,
         k.TenKhoaHoc   AS courseName,
         k.HinhThuNho   AS thumbnail,
         gv.HoTen       AS instructorName
       FROM  ChungChi  c
       JOIN  KhoaHoc   k  ON c.MaKH = k.MaKH
       JOIN  NguoiDung gv ON k.MaND_GiangVien = gv.MaND
       WHERE c.MaND = ?
       ORDER BY c.NgayCap DESC`,
      [userId],
    );

    return rows.map((row: any) => ({
      certificateId: row.certificateId,
      issuedDate: row.issuedDate,
      courseId: Number(row.courseId),
      courseName: row.courseName,
      thumbnail: row.thumbnail ?? null,
      instructorName: row.instructorName,
    }));
  }
}
