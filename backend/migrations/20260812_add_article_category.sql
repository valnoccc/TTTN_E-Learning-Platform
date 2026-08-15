-- Run once against the application's MySQL/TiDB database before deploying.
ALTER TABLE `BaiViet`
  ADD COLUMN `DanhMuc` ENUM('ANNOUNCEMENT', 'SYSTEM_UPDATE', 'PROMOTION', 'NEWS')
  NOT NULL DEFAULT 'NEWS' AFTER `TrangThai`,
  ADD COLUMN `IsPinned` TINYINT(1) NOT NULL DEFAULT 0 AFTER `DanhMuc`;
