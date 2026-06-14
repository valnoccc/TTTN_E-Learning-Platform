# API Contract

Source of truth:
- Swagger: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api-json`

## Auth & Account (Quan ly tai khoan)
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `PATCH /auth/profile` (Cap nhat thong tin ca nhan/tieu su)
- `PATCH /auth/change-password` (Doi mat khau)
- `POST /auth/forgot-password` (Khoi phuc mat khau)

## Users (Admin - Quan ly nguoi dung)
- `GET /users` (Xem danh sach tai khoan)
- `PATCH /users/:id/status` (Khoa/Mo khoa tai khoan)
- `PATCH /users/:id/roles` (Cap quyen he thong)

## Categories (Quan ly danh muc)
- `GET /categories` (Public - Hien thi danh muc)
- `POST /categories` (Admin - Them danh muc moi)
- `PATCH /categories/:id` (Admin - Sua danh muc)
- `DELETE /categories/:id` (Admin - Xoa danh muc)

## Courses (Quan ly khoa hoc)
Public & Student (Kham pha & Hoc tap)
- `GET /courses` (Tim kiem, loc khoa hoc)
- `GET /courses/:id` (Xem chi tiet khoa hoc)

Instructor (Giang vien)
- `GET /instructor/courses` (Xem danh sach khoa hoc cua toi)
- `POST /instructor/courses` (Them khoa hoc moi - Trang thai "Nhap")
- `PATCH /instructor/courses/:id` (Cap nhat noi dung khoa hoc)
- `DELETE /instructor/courses/:id` (An/Xoa khoa hoc)
- `POST /instructor/courses/:id/submit` (Gui yeu cau kiem duyet)
- `GET /instructor/coupons` (Instructor - Lay danh sach ma giam gia cua toi, ho tro `search` va `status`)
- `POST /instructor/coupons` (Instructor - Tao ma giam gia moi cho khoa hoc do minh so huu)
- `PATCH /instructor/coupons/:id/status` (Instructor - Bat/tat ma giam gia)
- `GET /courses/reviews` (Instructor - Lay tat ca danh gia khoa hoc cua giang vien)
- `GET /courses/discussions` (Instructor - Lay tat ca hoi dap/thao luan khoa hoc cua giang vien)
- `GET /courses/:id/discussions` (Instructor - Lay hoi dap/thao luan cua mot khoa hoc)
- `POST /courses/:id/discussions` (Instructor - Tra loi mot cau hoi thao luan, body: `{ noiDung: string, parentId: number }`)

Admin (Kiem duyet)
- `GET /admin/courses` (Admin - Xem danh sach khoa hoc, ho tro `status` va `search`)
- `GET /admin/courses/pending` (Xem danh sach cho duyet)
- `GET /admin/courses/:id` (Xem chi tiet khoa hoc cho quy trinh kiem duyet, gom muc tieu, yeu cau, curriculum, danh gia va lich su kiem duyet)
- `PATCH /admin/courses/:id/approve` (Phe duyet khoa hoc va luu lich su kiem duyet)
- `PATCH /admin/courses/:id/reject` (Tu choi khoa hoc, body: `{ lyDo: string }`, dong thoi tao thong bao cho giang vien va luu lich su kiem duyet)
- `PATCH /admin/courses/:id/hide` (An khoa hoc da xuat ban, body: `{ lyDo: string }`, chuyen trang thai sang `DRAFT`, tao thong bao va luu lich su kiem duyet)

## Lessons (Quan ly bai hoc)
- `GET /courses/:courseId/lessons` (Danh sach bai hoc cua khoa)
- `GET /lessons/:id` (Xem chi tiet video/tai lieu bai hoc - Yeu cau da mua khoa)
- `POST /courses/:courseId/lessons` (Instructor - Them bai hoc moi, ho tro `choPhepXemTruoc`)
- `PATCH /lessons/:id` (Instructor - Sua noi dung bai hoc, ho tro `choPhepXemTruoc`)
- `DELETE /lessons/:id` (Instructor - Xoa bai hoc)

## Enrollments & Progress (Giao dich & Tien do)
- `POST /enrollments` (Dang ky mua/Thanh toan khoa hoc)
- `GET /enrollments/me` (Xem danh sach khoa hoc da mua & lich su giao dich)
- `GET /enrollments/:courseId/status` (Kiem tra trang thai mua khoa hoc)
- `PATCH /enrollments/:courseId/progress` (He thong tu dong cap nhat tien do xem video)
- `POST /coupons/validate` (Kiem tra ma giam gia cho gio hang dang checkout, body: `{ maCode: string, courseIds: number[] }`)
- `POST /coupons/:id/consume` (Tam thoi cap nhat `SoLuongDaDung` sau khi frontend mock payment thanh cong; can thay bang luong payment backend that khi co)

## Submissions & Grading (Thuc hanh & Cham diem)
- `POST /lessons/:lessonId/submissions` (Student - Nop bai tap qua link GitHub)
- `GET /instructor/courses/:courseId/submissions` (Instructor - Xem danh sach bai nop cua hoc vien)
- `PATCH /submissions/:id/grade` (Instructor - Cham diem Dat/Khong dat & nhap nhan xet)
- `GET /submissions/me` (Student - Xem ket qua & phan hoi tu giang vien)

## Instructors (Giang vien)
- `GET /instructors/me/courses` (Lay danh sach khoa hoc cua giang vien)
- `GET /instructors/me/students` (Lay danh sach hoc vien da dang ky khoa hoc cua giang vien; khong tra ve link GitHub/bai nop)
- `GET /instructors/me/reports` (Lay du lieu trang bao cao giang vien; ho tro `courseId` va `range=30days|this_month|last_month|this_year|all_time`; mot so khoi UI duoc danh dau `MOCKDATA` neu backend chua co du lieu that)

## Notifications (Thong bao)
- `GET /notifications` (Lay danh sach thong bao cua toi, ho tro `limit`)
- `GET /notifications/unread-count` (Dem thong bao chua doc)
- `PATCH /notifications/:id/read` (Danh dau mot thong bao la da doc)
- `PATCH /notifications/read-all` (Danh dau tat ca thong bao la da doc)

## Rules
- Protected endpoints require `Bearer token` (JWT).
- Admin endpoints require `ADMIN` role.
- Instructor course/lesson mutations require `INSTRUCTOR` role.
- Student enrollments & submissions require `STUDENT` role (hoac role mac dinh khi user dang ky).
- Data Isolation: Giang vien chi duoc phep thao tac tren cac khoa hoc do chinh ho tao ra.
- Data Integrity: Khong duoc phep xoa cung khoa hoc/bai hoc neu da co hoc vien dang ky (`enrollments > 0`). Chuyen sang trang thai an (Soft Delete/Deactivate).
- Coupon rule: mot ma giam gia chi ap dung cho dung khoa hoc `MaKH` cua no; neu gio hang co nhieu khoa hoc thi chi giam tren khoa hoc khop ma.
- `PATCH /admin/courses/:id/ban` (Ban khoa hoc da xuat ban, body: `{ lyDo: string }`, chuyen trang thai sang `BANNED`, tao thong bao va luu lich su kiem duyet)
