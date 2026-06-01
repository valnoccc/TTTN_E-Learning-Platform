# API Contract

Source of truth:
- Swagger: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api-json`

## Auth & Account (Quản lý tài khoản)
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `PATCH /auth/profile` (Cập nhật thông tin cá nhân/tiểu sử)
- `PATCH /auth/change-password` (Đổi mật khẩu)
- `POST /auth/forgot-password` (Khôi phục mật khẩu)

## Users (Admin - Quản lý người dùng)
- `GET /users` (Xem danh sách tài khoản)
- `PATCH /users/:id/status` (Khóa/Mở khóa tài khoản)
- `PATCH /users/:id/roles` (Cấp quyền hệ thống)

## Categories (Quản lý danh mục)
- `GET /categories` (Public - Hiển thị danh mục)
- `POST /categories` (Admin - Thêm danh mục mới)
- `PATCH /categories/:id` (Admin - Sửa danh mục)
- `DELETE /categories/:id` (Admin - Xóa danh mục)

## Courses (Quản lý Khóa học)
**Public & Student (Khám phá & Học tập)**
- `GET /courses` (Tìm kiếm, lọc khóa học)
- `GET /courses/:id` (Xem chi tiết khóa học)

**Instructor (Giảng viên)**
- `GET /instructor/courses` (Xem danh sách khóa học của tôi)
- `POST /instructor/courses` (Thêm khóa học mới - Trạng thái "Nháp")
- `PATCH /instructor/courses/:id` (Cập nhật nội dung khóa học)
- `DELETE /instructor/courses/:id` (Ẩn/Xóa khóa học)
- `POST /instructor/courses/:id/submit` (Gửi yêu cầu kiểm duyệt)

**Admin (Kiểm duyệt)**
- `GET /admin/courses/pending` (Xem danh sách chờ duyệt)
- `PATCH /admin/courses/:id/approve` (Phê duyệt khóa học)
- `PATCH /admin/courses/:id/reject` (Từ chối khóa học kèm lý do)

## Lessons (Quản lý Bài học)
- `GET /courses/:courseId/lessons` (Danh sách bài học của khóa)
- `GET /lessons/:id` (Xem chi tiết video/tài liệu bài học - Yêu cầu đã mua khóa)
- `POST /courses/:courseId/lessons` (Instructor - Thêm bài học mới)
- `PATCH /lessons/:id` (Instructor - Sửa nội dung bài học)
- `DELETE /lessons/:id` (Instructor - Xóa bài học)

## Enrollments & Progress (Giao dịch & Tiến độ)
- `POST /enrollments` (Đăng ký mua/Thanh toán khóa học)
- `GET /enrollments/me` (Xem danh sách khóa học đã mua & lịch sử giao dịch)
- `GET /enrollments/:courseId/status` (Kiểm tra trạng thái mua khóa học)
- `PATCH /enrollments/:courseId/progress` (Hệ thống tự động cập nhật tiến độ xem video)

## Submissions & Grading (Thực hành & Chấm điểm)
- `POST /lessons/:lessonId/submissions` (Student - Nộp bài tập qua link GitHub)
- `GET /instructor/courses/:courseId/submissions` (Instructor - Xem danh sách bài nộp của học viên)
- `PATCH /submissions/:id/grade` (Instructor - Chấm điểm Đạt/Không đạt & nhập nhận xét)
- `GET /submissions/me` (Student - Xem kết quả & phản hồi từ giảng viên)

## Rules
- Protected endpoints require `Bearer token` (JWT).
- Admin endpoints require `ADMIN` role.
- Instructor course/lesson mutations require `INSTRUCTOR` role.
- Student enrollments & submissions require `STUDENT` role (hoặc role mặc định khi user đăng ký).
- **Data Isolation:** Giảng viên CHỈ ĐƯỢC PHÉP thao tác (Sửa/Xóa/Xem bài nộp) trên các khóa học do chính họ tạo ra.
- **Data Integrity:** Không được phép xóa cứng (Hard Delete) khóa học/bài học nếu đã có học viên đăng ký (`enrollments > 0`). Chuyển sang trạng thái Ẩn (Soft Delete/Deactivate).