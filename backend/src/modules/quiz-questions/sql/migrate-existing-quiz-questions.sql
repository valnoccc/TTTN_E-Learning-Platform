-- Migration for the legacy CauHoiTracNghiem table.
--
-- The current legacy table has the columns MaCH and MaBKT, while the backend
-- quiz module uses MaCauHoi and MaChuong. It is empty in the current database,
-- so keep it as a backup and create the schema expected by the application.
-- Run this script once on the database used by the backend.

RENAME TABLE CauHoiTracNghiem TO CauHoiTracNghiem_legacy;

CREATE TABLE CauHoiTracNghiem (
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
