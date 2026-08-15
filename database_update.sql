-- ==============================================================================
-- TỔNG HỢP CÁC THAY ĐỔI SCHEMA DATABASE (CHO NGƯỜI BẠN CÙNG NHÓM)
-- ==============================================================================

-- 1. Bổ sung cột lưu vết chấp nhận chính sách vào bảng NguoiDung (chạy lặp an toàn)
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'NguoiDung'
    AND COLUMN_NAME = 'instructorPolicyAcceptedAt'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE NguoiDung ADD COLUMN instructorPolicyAcceptedAt DATETIME DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'NguoiDung'
    AND COLUMN_NAME = 'forumPolicyAcceptedAt'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE NguoiDung ADD COLUMN forumPolicyAcceptedAt DATETIME DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.1. Danh mục bài viết (Blog / Learning Hub)
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'BaiViet'
    AND COLUMN_NAME = 'DanhMuc'
);
SET @sql = IF(
  @column_exists = 0,
  "ALTER TABLE BaiViet ADD COLUMN DanhMuc ENUM('ANNOUNCEMENT', 'SYSTEM_UPDATE', 'PROMOTION', 'NEWS') NOT NULL DEFAULT 'NEWS' AFTER TrangThai",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'BaiViet'
    AND COLUMN_NAME = 'IsPinned'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE BaiViet ADD COLUMN IsPinned TINYINT(1) NOT NULL DEFAULT 0 AFTER DanhMuc',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Di chuyển bảng Câu hỏi trắc nghiệm cũ sang legacy (chạy lặp an toàn)
SET @old_table_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'CauHoiTracNghiem'
);
SET @legacy_table_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'CauHoiTracNghiem_legacy'
);
SET @sql = IF(
  @old_table_exists = 1 AND @legacy_table_exists = 0,
  'RENAME TABLE CauHoiTracNghiem TO CauHoiTracNghiem_legacy',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Tạo bảng Câu hỏi trắc nghiệm cấu trúc mới (Do bạn bè làm)
CREATE TABLE IF NOT EXISTS CauHoiTracNghiem (
  MaCauHoi INT NOT NULL AUTO_INCREMENT,
  MaChuong INT NOT NULL,
  NoiDung TEXT NOT NULL,
  DapAnA VARCHAR(500) NOT NULL,
  DapAnB VARCHAR(500) NOT NULL,
  DapAnC VARCHAR(500) NOT NULL,
  DapAnD VARCHAR(500) NOT NULL,
  DapAnDung ENUM('A', 'B', 'C', 'D') NOT NULL,
  ThuTu INT NOT NULL DEFAULT 1,
  NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  NgayCapNhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (MaCauHoi),
  INDEX IDX_CauHoiTracNghiem_MaChuong_ThuTu (MaChuong, ThuTu),
  CONSTRAINT FK_CauHoiTracNghiem_ChuongHoc
    FOREIGN KEY (MaChuong) REFERENCES ChuongHoc (MaChuong)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 4. Tạo bảng Lịch sử làm bài thi trắc nghiệm (Do bạn bè làm)
CREATE TABLE IF NOT EXISTS LichSuLamBai (
  MaLichSu BIGINT NOT NULL AUTO_INCREMENT,
  MaND INT NOT NULL,
  MaChuong INT NOT NULL,
  LanThu INT NOT NULL,
  TongSoCau INT NOT NULL,
  SoCauDung INT NOT NULL DEFAULT 0,
  TyLeDung DECIMAL(5,2) NOT NULL DEFAULT 0,
  Dat BIT NOT NULL DEFAULT 0,
  TrangThai ENUM('IN_PROGRESS', 'SUBMITTED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
  BatDauLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  NopLuc DATETIME NULL,
  PRIMARY KEY (MaLichSu),
  UNIQUE KEY UQ_LichSuLamBai_NguoiDung_Chuong_Lan (MaND, MaChuong, LanThu),
  INDEX IDX_LichSuLamBai_NguoiDung_Chuong (MaND, MaChuong),
  CONSTRAINT FK_LichSuLamBai_NguoiDung FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND),
  CONSTRAINT FK_LichSuLamBai_ChuongHoc FOREIGN KEY (MaChuong) REFERENCES ChuongHoc(MaChuong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tạo bảng Chi tiết lịch sử làm bài thi trắc nghiệm (Do bạn bè làm)
CREATE TABLE IF NOT EXISTS ChiTietLichSuLamBai (
  MaChiTiet BIGINT NOT NULL AUTO_INCREMENT,
  MaLichSu BIGINT NOT NULL,
  MaCauHoi INT NOT NULL,
  DapAnChon ENUM('A', 'B', 'C', 'D') NULL,
  DapAnDung ENUM('A', 'B', 'C', 'D') NOT NULL,
  Dung BIT NOT NULL DEFAULT 0,
  PRIMARY KEY (MaChiTiet),
  UNIQUE KEY UQ_ChiTietLichSuLamBai_CauHoi (MaLichSu, MaCauHoi),
  CONSTRAINT FK_ChiTietLichSuLamBai_LichSu FOREIGN KEY (MaLichSu)
    REFERENCES LichSuLamBai(MaLichSu) ON DELETE CASCADE,
  CONSTRAINT FK_ChiTietLichSuLamBai_CauHoi FOREIGN KEY (MaCauHoi)
    REFERENCES CauHoiTracNghiem(MaCauHoi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
