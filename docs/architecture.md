# Architecture

## Frontend Architecture
Layered & Role-based structure (Tối ưu cho React + Vite).

- `src/api`: RTK Query endpoints và cấu hình gốc (`baseApi.ts`, `authApi.ts`, `coursesApi.ts`,...)
- `src/store`: Cấu hình Redux Toolkit (`store.ts`) và Client State Slices (`authSlice.ts`)
- `src/components`: Các UI components tái sử dụng (Button, Input, Modal, VideoPlayer,...)
- `src/layouts`: Layout bọc giao diện theo phân quyền (MainLayout, AdminLayout, InstructorLayout)
- `src/pages`: Các trang (Pages) được phân nhóm theo Actor (`admin`, `auth`, `instructor`, `student`)
- `src/routes`: Cấu hình điều hướng React Router
- `src/assets`: Chứa tài nguyên tĩnh (hình ảnh, icons)

## Backend Architecture
NestJS module-based structure.

- `src/modules/auth`: Xác thực, cấp phát JWT và xử lý phân quyền (Roles Guard)
- `src/modules/users`: Quản lý tài khoản (khóa/mở, phân quyền hệ thống)
- `src/modules/categories`: Quản lý danh mục khóa học
- `src/modules/courses`: Quản lý khóa học và quy trình kiểm duyệt (Nháp -> Chờ duyệt -> Đã xuất bản)
- `src/modules/lessons`: Quản lý nội dung bài học (video, tài liệu)
- `src/modules/enrollments`: Đăng ký, thanh toán và ghi nhận tiến độ học tập tuyến tính
- `src/modules/submissions`: Xử lý luồng nộp mã nguồn thực hành và chấm điểm
- `src/common`: Chứa các thành phần dùng chung toàn cục (Guards, Interceptors, Custom Decorators, Filters)
- `src/prisma`: Cấu hình Prisma ORM (Schema và Client Service)

## Data Flow
**Luồng truy xuất và cập nhật dữ liệu tiêu chuẩn:**
React component -> RTK Query hook -> NestJS controller -> Service -> Prisma ORM -> MySQL (TiDB)

**Luồng dữ liệu đặc thù (Chức năng Thực hành & Chấm bài):**
Học viên push code lên kho lưu trữ GitHub -> Copy URL nộp qua React Component -> RTK Query Mutation -> NestJS API -> Prisma ORM lưu liên kết vào MySQL -> Giảng viên truy xuất URL qua giao diện để chấm điểm và trả kết quả ngược lại quy trình.