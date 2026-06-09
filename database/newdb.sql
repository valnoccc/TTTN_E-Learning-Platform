-- ==============================================================================
-- 1. XÓA CÁC BẢNG VÀ VIEW CŨ NẾU TỒN TẠI (Theo thứ tự an toàn)
-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS 
    ThongBao, TienDoHocTap, DapAn, CauHoi, KetQuaQuiz, BaiKiemTra, 
    BaiHoc, ChuongHoc, BaiNopDuAn, DuAnCuoiKhoa, ThaoLuanKhoaHoc, DanhGiaKhoaHoc, 
    MucTieuKhoaHoc, YeuCauKhoaHoc, YeuThich, ChungChi, ChiTietGioHang, GioHang, 
    DangKyKhoaHoc, LichSuThanhToan, ChiTietHoaDon, HoaDon, MaGiamGia, KhoaHoc, DanhMuc, 
    HoSoGiangVien, DienDanVote, DienDanBinhLuan, DienDanTopic, NguoiDung;

DROP VIEW IF EXISTS vw_DoanhThu;
DROP VIEW IF EXISTS vw_ThongKeKhoaHoc;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 2. TẠO CÁC BẢNG (MỨC ĐỘ 0 - KHÔNG PHỤ THUỘC)
-- ==============================================================================

-- Bảng Người Dùng
CREATE TABLE NguoiDung (
    MaND INT AUTO_INCREMENT PRIMARY KEY,
    HoTen VARCHAR(255) NOT NULL,
    Email VARCHAR(191) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    VaiTro ENUM('STUDENT', 'INSTRUCTOR', 'ADMIN') DEFAULT 'STUDENT',
    AnhDaiDien VARCHAR(255) NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TrangThai ENUM('ACTIVE', 'INACTIVE', 'BANNED', 'DELETED') DEFAULT 'ACTIVE',
    DeletedAt TIMESTAMP NULL
);

-- Bảng Danh Mục Khóa Học
CREATE TABLE DanhMuc (
    MaDM INT AUTO_INCREMENT PRIMARY KEY,
    TenDM VARCHAR(255) NOT NULL,
    MoTa TEXT NULL
);

-- Bảng Mã Giảm Giá (Coupon)
CREATE TABLE MaGiamGia (
    MaCoupon INT AUTO_INCREMENT PRIMARY KEY,
    MaCode VARCHAR(50) UNIQUE NOT NULL,
    GiaTriGiam DECIMAL(10,2) NOT NULL,
    LoaiGiam ENUM('PERCENT', 'AMOUNT') DEFAULT 'PERCENT',
    TrangThai ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    NgayBatDau DATETIME,
    NgayKetThuc DATETIME
);

-- ==============================================================================
-- 3. TẠO CÁC BẢNG (MỨC ĐỘ 1)
-- ==============================================================================

-- Bảng Hồ Sơ Giảng Viên
CREATE TABLE HoSoGiangVien (
    MaHoSo INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT UNIQUE NOT NULL,
    TieuSu TEXT NULL,
    ChuyenMon VARCHAR(255) NULL,
    SoTaiKhoan VARCHAR(50) NULL,
    FacebookURL VARCHAR(255) NULL,
    InstagramURL VARCHAR(255) NULL,
    GitHubURL VARCHAR(255) NULL,
    WebsiteURL VARCHAR(255) NULL,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE
);

-- Bảng Khóa Học
CREATE TABLE KhoaHoc (
    MaKH INT AUTO_INCREMENT PRIMARY KEY,
    MaDM INT NOT NULL,
    MaND_GiangVien INT NOT NULL,
    TenKhoaHoc VARCHAR(255) NOT NULL,
    MoTa TEXT NULL,
    GiaBan DECIMAL(10, 2) DEFAULT 0.00,
    HinhThuNho VARCHAR(255) NULL,
    ThoiLuong INT DEFAULT 0,
    CapDo ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER',
    NgonNgu VARCHAR(50) DEFAULT 'Tiếng Việt',
    TrangThai ENUM('DRAFT', 'PUBLISHED', 'BANNED', 'DELETED') DEFAULT 'DRAFT',
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DeletedAt TIMESTAMP NULL,
    FOREIGN KEY (MaDM) REFERENCES DanhMuc(MaDM),
    FOREIGN KEY (MaND_GiangVien) REFERENCES NguoiDung(MaND)
);

-- Bảng Hóa Đơn
CREATE TABLE HoaDon (
    MaHD INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT NOT NULL,
    TongTien DECIMAL(10, 2) NOT NULL,
    TrangThaiThanhToan ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
    PhuongThucThanhToan VARCHAR(50) NULL,
    MaGiaoDich VARCHAR(255) NULL,
    NgayThanhToan DATETIME NULL,
    MaCoupon INT NULL,
    NgayLap TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND),
    FOREIGN KEY (MaCoupon) REFERENCES MaGiamGia(MaCoupon) ON DELETE SET NULL
);

-- Bảng Giỏ Hàng
CREATE TABLE GioHang (
    MaGioHang INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT NOT NULL UNIQUE,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE
);

-- Bảng Thông Báo
CREATE TABLE ThongBao (
    MaTB INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT NOT NULL,
    LoaiThongBao ENUM('COURSE', 'PAYMENT', 'CERTIFICATE', 'SYSTEM') DEFAULT 'SYSTEM',
    TieuDe VARCHAR(255) NOT NULL,
    NoiDung TEXT NOT NULL,
    DaDoc BOOLEAN DEFAULT FALSE,
    ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE
);

-- Bảng Diễn Đàn Topic
CREATE TABLE DienDanTopic (
    MaTopic INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT NOT NULL,
    TieuDe VARCHAR(255) NOT NULL,
    NoiDung TEXT NOT NULL,
    ThoiGian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE
);

-- ==============================================================================
-- 4. TẠO CÁC BẢNG (MỨC ĐỘ 2)
-- ==============================================================================

-- Bảng Chương Học
CREATE TABLE ChuongHoc (
    MaChuong INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL,
    TenChuong VARCHAR(255) NOT NULL,
    ThuTu INT NOT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE
);

-- Bảng Mục Tiêu Khóa Học (Cập nhật giao diện nhập nhiều dòng)
CREATE TABLE MucTieuKhoaHoc (
    MaMT INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL,
    NoiDung VARCHAR(255) NOT NULL,
    ThuTu INT NOT NULL DEFAULT 1,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE
);

-- Bảng Yêu Cầu Khóa Học (Cập nhật giao diện nhập nhiều dòng)
CREATE TABLE YeuCauKhoaHoc (
    MaYC INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL,
    NoiDung VARCHAR(255) NOT NULL,
    ThuTu INT NOT NULL DEFAULT 1,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE
);

-- Bảng Yêu Thích (Wishlist)
CREATE TABLE YeuThich (
    MaND INT NOT NULL,
    MaKH INT NOT NULL,
    NgayThem DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(MaND, MaKH),
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE
);

-- Bảng Bài Kiểm Tra
CREATE TABLE BaiKiemTra (
    MaBKT INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL,
    TieuDe VARCHAR(255) NOT NULL,
    SoLanToiDa INT DEFAULT 1,
    DiemVuotQua DECIMAL(4, 2) DEFAULT 5.00,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE
);

-- Bảng Dự Án Cuối Khóa
CREATE TABLE DuAnCuoiKhoa (
    MaDuAn INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL UNIQUE, 
    TieuDe VARCHAR(255) NOT NULL,
    YeuCau TEXT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE
);

-- Bảng Đăng Ký Khóa Học
CREATE TABLE DangKyKhoaHoc (
    MaDangKy INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT NOT NULL,
    MaKH INT NOT NULL,
    MaHD INT NULL, 
    NgayDangKy DATETIME DEFAULT CURRENT_TIMESTAMP,
    TrangThai ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED') DEFAULT 'ACTIVE',
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE,
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD) ON DELETE SET NULL,
    UNIQUE(MaND, MaKH)
);

-- Bảng Đánh Giá Khóa Học
CREATE TABLE DanhGiaKhoaHoc (
    MaDanhGia INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL,
    MaND INT NOT NULL,
    SoSao INT NULL,
    NoiDung TEXT NULL,
    ThoiGian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MaDanhGiaCha INT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    FOREIGN KEY (MaDanhGiaCha) REFERENCES DanhGiaKhoaHoc(MaDanhGia) ON DELETE CASCADE
);

-- Bảng Thảo Luận Khóa Học
CREATE TABLE ThaoLuanKhoaHoc (
    MaThaoLuan INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT NOT NULL,
    MaND INT NOT NULL,
    NoiDung TEXT NOT NULL,
    ThoiGian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MaThaoLuanCha INT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    FOREIGN KEY (MaThaoLuanCha) REFERENCES ThaoLuanKhoaHoc(MaThaoLuan) ON DELETE CASCADE
);

-- Bảng Chi Tiết Hóa Đơn
CREATE TABLE ChiTietHoaDon (
    MaCTHD INT AUTO_INCREMENT PRIMARY KEY,
    MaHD INT NOT NULL,
    MaKH INT NOT NULL,
    GiaGhiNhan DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD) ON DELETE CASCADE,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH)
);

-- Bảng Lịch Sử Thanh Toán
CREATE TABLE LichSuThanhToan (
    MaLS INT AUTO_INCREMENT PRIMARY KEY,
    MaHD INT NOT NULL,
    TrangThaiCu VARCHAR(50) NULL,
    TrangThaiMoi VARCHAR(50) NOT NULL,
    ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD) ON DELETE CASCADE
);

-- Bảng Chi Tiết Giỏ Hàng
CREATE TABLE ChiTietGioHang (
    MaCTGH INT AUTO_INCREMENT PRIMARY KEY,
    MaGioHang INT NOT NULL,
    MaKH INT NOT NULL,
    FOREIGN KEY (MaGioHang) REFERENCES GioHang(MaGioHang) ON DELETE CASCADE,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE,
    UNIQUE(MaGioHang, MaKH)
);

-- Bảng Chứng Chỉ
CREATE TABLE ChungChi (
    MaCC INT AUTO_INCREMENT PRIMARY KEY,
    MaND INT NOT NULL,
    MaKH INT NOT NULL,
    MaChungChi VARCHAR(50) UNIQUE NOT NULL,
    NgayCap DATETIME DEFAULT CURRENT_TIMESTAMP,
    DuongDanPDF VARCHAR(255) NULL,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    FOREIGN KEY (MaKH) REFERENCES KhoaHoc(MaKH) ON DELETE CASCADE,
    UNIQUE(MaND, MaKH)
);

-- Bảng Bình Luận Diễn Đàn
CREATE TABLE DienDanBinhLuan (
    MaBinhLuan INT AUTO_INCREMENT PRIMARY KEY,
    MaTopic INT NOT NULL,
    MaND INT NOT NULL, 
    MaBLCha INT NULL,
    NoiDung TEXT NOT NULL,
    ThoiGian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaTopic) REFERENCES DienDanTopic(MaTopic) ON DELETE CASCADE,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    FOREIGN KEY (MaBLCha) REFERENCES DienDanBinhLuan(MaBinhLuan) ON DELETE CASCADE
);

-- Bảng Vote Diễn Đàn
CREATE TABLE DienDanVote (
    MaVote INT AUTO_INCREMENT PRIMARY KEY,
    MaTopic INT NOT NULL,
    MaND INT NOT NULL, 
    LoaiVote ENUM('UPVOTE', 'DOWNVOTE') NOT NULL,
    FOREIGN KEY (MaTopic) REFERENCES DienDanTopic(MaTopic) ON DELETE CASCADE,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vote_topic (MaND, MaTopic)
);

-- ==============================================================================
-- 5. TẠO CÁC BẢNG (MỨC ĐỘ 3)
-- ==============================================================================

-- Bảng Bài Học
CREATE TABLE BaiHoc (
    MaBH INT AUTO_INCREMENT PRIMARY KEY,
    MaChuong INT NOT NULL,
    TenBaiHoc VARCHAR(255) NOT NULL,
    NoiDung TEXT NULL,
    VideoURL VARCHAR(255) NULL,
    ThuTu INT NOT NULL,
    ThoiLuong INT DEFAULT 0,
    TrangThai ENUM('ACTIVE', 'DELETED') DEFAULT 'ACTIVE',
    DeletedAt TIMESTAMP NULL,
    FOREIGN KEY (MaChuong) REFERENCES ChuongHoc(MaChuong) ON DELETE CASCADE
);

-- Bảng Câu Hỏi
CREATE TABLE CauHoi (
    MaCH INT AUTO_INCREMENT PRIMARY KEY,
    MaBKT INT NOT NULL,
    NoiDung TEXT NOT NULL,
    FOREIGN KEY (MaBKT) REFERENCES BaiKiemTra(MaBKT) ON DELETE CASCADE
);

-- Bảng Kết Quả Quiz
CREATE TABLE KetQuaQuiz (
    MaKQ INT AUTO_INCREMENT PRIMARY KEY,
    MaBKT INT NOT NULL,
    MaND INT NOT NULL,
    DiemSo DECIMAL(4, 2) NOT NULL,
    SoLanLam INT DEFAULT 1,
    ThoiGianLam TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaBKT) REFERENCES BaiKiemTra(MaBKT) ON DELETE CASCADE,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE
);

-- Bảng Bài Nộp Dự Án
CREATE TABLE BaiNopDuAn (
    MaBN INT AUTO_INCREMENT PRIMARY KEY,
    MaDuAn INT NOT NULL,
    MaND INT NOT NULL, 
    LinkGitHub VARCHAR(255) NULL,
    DiemSo DECIMAL(4, 2) NULL,
    NhanXet TEXT NULL,
    TrangThai ENUM('PENDING', 'PASSED', 'FAILED') DEFAULT 'PENDING',
    FOREIGN KEY (MaDuAn) REFERENCES DuAnCuoiKhoa(MaDuAn) ON DELETE CASCADE,
    FOREIGN KEY (MaND) REFERENCES NguoiDung(MaND) ON DELETE CASCADE
);

-- ==============================================================================
-- 6. TẠO CÁC BẢNG (MỨC ĐỘ 4)
-- ==============================================================================

-- Bảng Đáp Án
CREATE TABLE DapAn (
    MaDA INT AUTO_INCREMENT PRIMARY KEY,
    MaCH INT NOT NULL,
    NoiDungDapAn TEXT NOT NULL,
    LaDapAnDung BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (MaCH) REFERENCES CauHoi(MaCH) ON DELETE CASCADE
);

-- Bảng Tiến Độ Học Tập
CREATE TABLE TienDoHocTap (
    MaTienDo INT AUTO_INCREMENT PRIMARY KEY,
    MaDangKy INT NOT NULL,
    MaBH INT NOT NULL,
    DaHoanThanh BOOLEAN DEFAULT FALSE,
    ThoiGianXemMax INT DEFAULT 0,
    ThoiGianHoc INT DEFAULT 0,
    PhanTramHoanThanh DECIMAL(5,2) DEFAULT 0.00,
    LanXemCuoi DATETIME NULL,
    FOREIGN KEY (MaDangKy) REFERENCES DangKyKhoaHoc(MaDangKy) ON DELETE CASCADE,
    FOREIGN KEY (MaBH) REFERENCES BaiHoc(MaBH) ON DELETE CASCADE,
    UNIQUE KEY (MaDangKy, MaBH)
);

-- ==============================================================================
-- 7. KHỞI TẠO CÁC VIEW BÁO CÁO THỐNG KÊ
-- ==============================================================================

-- View Thống kê doanh thu theo tháng
CREATE VIEW vw_DoanhThu AS
SELECT 
    MONTH(NgayLap) AS Thang,
    YEAR(NgayLap) AS Nam,
    SUM(TongTien) AS DoanhThu
FROM HoaDon
WHERE TrangThaiThanhToan = 'PAID'
GROUP BY YEAR(NgayLap), MONTH(NgayLap);

-- View Thống kê Khóa Học
CREATE VIEW vw_ThongKeKhoaHoc AS
SELECT 
    KH.MaKH,
    KH.TenKhoaHoc,
    COUNT(DISTINCT DK.MaND) AS SoLuongHocVien,
    IFNULL(AVG(DG.SoSao), 0) AS DanhGiaTrungBinh,
    COUNT(DISTINCT DG.MaDanhGia) AS TongSoDanhGia
FROM KhoaHoc KH
LEFT JOIN DangKyKhoaHoc DK ON KH.MaKH = DK.MaKH AND DK.TrangThai = 'ACTIVE'
LEFT JOIN DanhGiaKhoaHoc DG ON KH.MaKH = DG.MaKH AND DG.SoSao IS NOT NULL
GROUP BY KH.MaKH, KH.TenKhoaHoc;