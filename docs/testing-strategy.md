# Testing Strategy

Tài liệu này xác định các chiến lược, công cụ và phạm vi kiểm thử (testing scope) cho cả Frontend và Backend của nền tảng học lập trình trực tuyến, đảm bảo hệ thống vận hành đúng với các Use Case và phân quyền đã đặc tả.

## 1. Frontend Testing
**Công cụ sử dụng (Tools):**
- **Vitest:** Dùng để chạy Unit Test cho các hàm utility, hooks tùy chỉnh và Redux slices.
- **React Testing Library (RTL):** Dùng để kiểm thử hành vi của các Component (Component behavior), đảm bảo giao diện phản hồi đúng với tương tác của người dùng.
- **Playwright (hoặc Cypress):** Dùng để kiểm thử luồng người dùng thực tế (End-to-End / User flows).

**Phạm vi kiểm thử (What to Test):**
- **Luồng Xác thực (Auth Flow):** - Render và validate các form đăng ký, đăng nhập, khôi phục mật khẩu.
  - Phản hồi giao diện khi nhập sai/đúng thông tin.
- **Phân hệ Người học (Student Flows):** - Render danh sách khóa học, chức năng tìm kiếm và bộ lọc (Search & Filter).
  - Trạng thái hiển thị của nút "Mua khóa học" (Purchase button) đối với khách và học viên đã đăng nhập.
  - Luồng thanh toán giả lập (Mock payment flow).
  - Khả năng tải video, lưu trạng thái tiến độ học tập và form nộp bài tập (link GitHub).
- **Phân hệ Giảng viên (Instructor Flows):**
  - Form tạo khóa học mới, upload video/tài liệu bài học.
  - Giao diện chấm bài và phản hồi cho học viên.
  - Render biểu đồ thống kê doanh thu.
- **Phân hệ Quản trị viên (Admin Flows):**
  - Bảng danh sách khóa học chờ duyệt (Approve/Reject buttons).
  - Bảng quản lý người dùng (Khóa/Mở khóa tài khoản).

## 2. Backend Testing
**Công cụ sử dụng (Tools):**
- **Jest:** Dùng để chạy Unit Test cho các Services, đảm bảo logic nghiệp vụ (business logic) hoạt động chính xác độc lập với Database.
- **Supertest:** Dùng để kiểm thử tích hợp (Integration tests) và End-to-End cho các Controllers và API endpoints.

**Phạm vi kiểm thử (What to Test):**
- **Phân quyền và Xác thực (Auth Rules & RBAC):**
  - Kiểm tra tính hợp lệ của JWT token.
  - Đảm bảo các Guard/Middleware chặn đúng quyền (VD: API duyệt khóa học sẽ báo lỗi `403 Forbidden` nếu gọi bằng token của Giảng viên hoặc Học viên).
- **Luồng Khóa học (Course CRUD & States):**
  - Tạo, cập nhật, xóa khóa học và bài học.
  - Kiểm tra luồng chuyển đổi trạng thái chính xác (Draft -> Pending -> Approved/Rejected).
- **Luồng Giao dịch & Tiến độ (Enrollment & Progress):**
  - Ngăn chặn triệt để việc đăng ký trùng lặp (Duplicate enrollment prevention).
  - Kiểm tra logic tự động cập nhật phần trăm tiến độ xem video.
- **Tính Toàn vẹn Dữ liệu (Data Integrity Constraints):**
  - Kiểm thử lỗi khi cố tình Xóa cứng (Hard Delete) một khóa học hoặc bài học đã có học viên đăng ký (Phải trả về lỗi ràng buộc hoặc chuyển sang Xóa mềm/Ẩn).
- **Luồng Thực hành & Diễn đàn (Submissions & Forum):**
  - API nộp bài: Validate URL GitHub hợp lệ.
  - API đánh giá, CRUD câu hỏi Q&A và bài đăng diễn đàn.