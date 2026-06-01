# Project Overview

## 1. Introduction
**Project Name:** E-Learning Platform (B2C Model)  
**Repository:** [https://github.com/valnoccc/TTTN_E-Learning-Platform](https://github.com/valnoccc/TTTN_E-Learning-Platform)  
**Domain:** EdTech / Công nghệ thông tin  

Đây là dự án xây dựng một nền tảng học lập trình trực tuyến theo mô hình B2C (Business-to-Consumer). Hệ thống được thiết kế chuyên biệt cho việc giảng dạy và học tập ngành Công nghệ Thông tin, kết nối những chuyên gia/giảng viên tự do với học viên có nhu cầu nâng cao kỹ năng lập trình. Điểm nổi bật của nền tảng là sự kết hợp giữa học lý thuyết qua video và luồng thực hành mã nguồn thực tế thông qua GitHub.

## 2. Tech Stack
Dự án áp dụng kiến trúc Client-Server hiện đại, tách biệt hoàn toàn giữa Frontend và Backend.

### Frontend
- **Framework/Library:** React (Functional Components & Hooks)
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** - Redux Toolkit (Global UI & Auth State)
  - RTK Query (Data Fetching & Server State Caching)

### Backend
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Engine:** MySQL

## 3. Core Actors & Features
Hệ thống xoay quanh 3 nhóm người dùng (Actors) chính với các quyền hạn và luồng nghiệp vụ riêng biệt:

### 3.1. Student (Người học)
- **Khám phá & Giao dịch:** Tìm kiếm, lọc khóa học và thực hiện thanh toán.
- **Học tập:** Xem video bài giảng (hệ thống tự động lưu vị trí dừng), đọc tài liệu và ghi chú.
- **Tiến độ (Linear Progress):** Bị ràng buộc học theo thứ tự tuyến tính, phải hoàn thành bài học trước mới được mở khóa bài học sau.
- **Thực hành:** Nộp bài tập lập trình bằng cách cung cấp URL kho lưu trữ GitHub cá nhân.
- **Tương tác:** Tham gia hỏi đáp (Q&A) dưới mỗi bài giảng và thảo luận trên Diễn đàn (Forum) cộng đồng.

### 3.2. Instructor (Giảng viên)
- **Sản xuất nội dung:** Tạo mới, chỉnh sửa khóa học và bài học (video, tài liệu, bài tập code).
- **Xuất bản:** Gửi yêu cầu xuất bản khóa học lên hệ thống (Chờ Admin duyệt).
- **Chấm bài (Grading):** Truy cập link GitHub của học viên, đánh giá mã nguồn, chấm điểm (Đạt/Không đạt) và để lại nhận xét chuyên môn.
- **Thống kê:** Theo dõi số lượng lượt đăng ký và doanh thu cá nhân.

### 3.3. Admin (Quản trị viên)
- **Kiểm duyệt nội dung:** Đóng vai trò là "người gác cổng", xem xét và quyết định Phê duyệt (Approve) hoặc Từ chối (Reject) các khóa học do giảng viên gửi lên.
- **Quản lý hệ thống:** Quản lý tài khoản (Khóa/Mở khóa, Cấp quyền), quản lý danh mục công nghệ.
- **Kiểm duyệt cộng đồng:** Ẩn/Xóa các bài đăng, bình luận hoặc đánh giá vi phạm tiêu chuẩn trên diễn đàn.
- **Báo cáo:** Theo dõi doanh thu toàn sàn và sự tăng trưởng của nền tảng.

## 4. Key Workflows & Business Rules
- **Luồng phê duyệt khóa học (Course Moderation Flow):** Khóa học mới tạo mang trạng thái `Draft` (Nháp) -> Giảng viên gửi duyệt sẽ chuyển sang `Pending` (Chờ duyệt) -> Admin duyệt sẽ chuyển thành `Published` (Đã xuất bản).
- **Bảo toàn dữ liệu (Data Integrity Constraints):** Không cho phép Xóa vật lý (Hard Delete) đối với khóa học hoặc bài học đã có học viên đăng ký nhằm bảo vệ toàn vẹn tiến độ học tập. Chuyển sang cơ chế Ẩn (Soft Delete).
- **Phân quyền bảo mật (RBAC):** Mọi API đều được bảo vệ bởi Guard của NestJS. Dữ liệu của giảng viên nào chỉ giảng viên đó được quyền can thiệp (Data Isolation).

## 5. Project Structure Overview
- `frontend/`: Chứa toàn bộ mã nguồn React/Vite, cấu trúc theo Feature-based và phân tách theo Actor (`auth`, `admin`, `instructor`, `student`).
- `backend/`: Chứa mã nguồn NestJS, cấu trúc theo Module-based (chia nhỏ thành `auth`, `courses`, `users`, `enrollments`, v.v.).
- `docs/`: Chứa các tài liệu đặc tả yêu cầu, chiến lược kiểm thử, API contract và quy chuẩn code (Coding conventions).