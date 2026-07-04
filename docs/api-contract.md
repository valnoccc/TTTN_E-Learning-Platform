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
- `GET /admin/dashboard/stats` (Admin - Lay thong ke dashboard; bao gom `grossRevenue`, `adminRevenue = 20%`, `instructorPayout = 80%`, `newEnrollments`, `pendingCourses`, `revenueChart`, `salesChart`, `categoryRevenue`, `topCourses`, `topInstructors`, `recentOrders` va cac KPI tang truong)
- `GET /admin/dashboard/debts?month=MM&year=YYYY` (Admin - Lay cong no giang vien theo thang; tra ve `monthLabel`, `summary` va `items` cho tung giang vien, trong do `debtAmount = instructorPayout = 80% doanh thu hop le trong thang`)
- `GET /admin/users` (Admin - Xem danh sach tai khoan, ho tro `search`, `role`, `status`; tra ve them `summary`)
- `PATCH /admin/users/:id/status` (Admin - Khoa/Mo/An tai khoan, body: `{ status: 'ACTIVE' | 'INACTIVE' | 'DELETED' }`)
- `PATCH /admin/users/:id/role` (Admin - Cap vai tro he thong, body: `{ role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' }`)
- `PATCH /admin/users/bulk/status` (Admin - Cap nhat trang thai hang loat, body: `{ ids: number[], status: 'ACTIVE' | 'INACTIVE' | 'DELETED' }`)
- `PATCH /admin/users/bulk/role` (Admin - Cap nhat vai tro hang loat, body: `{ ids: number[], role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' }`)

## Categories (Quan ly danh muc)
- `GET /categories` (Public - Hien thi danh muc, ho tro `search`)
- `GET /admin/categories` (Admin - Xem danh sach danh muc, ho tro `search`)
- `POST /admin/categories` (Admin - Them danh muc moi, body: `{ TenDM: string, MoTa?: string }`)
- `PATCH /admin/categories/:id` (Admin - Sua danh muc, body: `{ TenDM?: string, MoTa?: string }`)
- `DELETE /admin/categories/:id` (Admin - Xoa danh muc; khong cho phep xoa neu danh muc dang duoc khoa hoc su dung)

## Courses (Quan ly khoa hoc)
Public & Student (Kham pha & Hoc tap)
- `GET /courses` (Tim kiem, loc khoa hoc)
- `GET /courses/:id` (Xem chi tiet khoa hoc)

Instructor (Giang vien)
- `GET /instructor/courses` (Xem danh sach khoa hoc cua toi)
- `POST /instructor/courses` (Them khoa hoc moi - Trang thai "Nhap")
- `PATCH /instructor/courses/:id` (Cap nhat noi dung khoa hoc)
- `DELETE /instructor/courses/:id` (An/Xoa khoa hoc)
- `POST /courses/:id/chapters` (Instructor - Them chuong hoc moi cho khoa hoc do minh so huu)
- `PATCH /courses/chapters/:chapterId` (Instructor - Doi ten chuong hoc do minh so huu)
- `DELETE /courses/chapters/:chapterId` (Instructor - Xoa chuong hoc va cac bai hoc ben trong neu chuong thuoc khoa hoc cua minh)
- `POST /instructor/courses/:id/submit` (Gui yeu cau kiem duyet)
- `GET /instructor/coupons` (Instructor - Lay danh sach ma giam gia cua toi, ho tro `search` va `status`)
- `POST /instructor/coupons` (Instructor - Tao ma giam gia moi cho khoa hoc do minh so huu)
- `PATCH /instructor/coupons/:id/status` (Instructor - Bat/tat ma giam gia)
- `GET /courses/reviews` (Instructor - Lay tat ca danh gia khoa hoc cua giang vien)
- `GET /courses/discussions` (Instructor - Lay tat ca hoi dap/thao luan khoa hoc cua giang vien)
- `GET /courses/:id/discussions` (Instructor - Lay hoi dap/thao luan cua mot khoa hoc)
- `POST /courses/:id/discussions` (Instructor - Tra loi mot cau hoi thao luan, body: `{ noiDung: string, parentId: number }`)
- `DELETE /courses/discussions/:discussionId` (Instructor - Xoa binh luan/phan hoi cua chinh minh trong khoa hoc do minh so huu)
- `DELETE /courses/reviews/:reviewId` (Instructor - Xoa phan hoi danh gia cua chinh minh trong khoa hoc do minh so huu)

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
- `POST /checkout/momo/return` (Student - Xac thuc payload return co chu ky tu MoMo va dong bo trang thai hoa don; body la query params MoMo tra ve, response gom `invoiceId`, `resultCode`, `paymentStatus`)
- `DELETE /admin/coupons/:id` (Admin - Xoa cung coupon neu chua co luot su dung; neu da co `SoLuongDaDung > 0` thi tra loi chan xoa)

## Submissions & Grading (Thuc hanh & Cham diem)
- `POST /lessons/:lessonId/submissions` (Student - Nop bai tap qua link GitHub)
- `GET /instructor/courses/:courseId/submissions` (Instructor - Xem danh sach bai nop cua hoc vien)
- `PATCH /submissions/:id/grade` (Instructor - Cham diem Dat/Khong dat & nhap nhan xet)
- `GET /submissions/me` (Student - Xem ket qua & phan hoi tu giang vien)

## Instructors (Giang vien)
- `GET /instructors/me/courses` (Lay danh sach khoa hoc cua giang vien)
- `GET /instructors/me/students` (Lay danh sach hoc vien da dang ky khoa hoc cua giang vien; khong tra ve link GitHub/bai nop)
- `GET /instructors/me/reports` (Lay du lieu trang bao cao giang vien; ho tro `courseId` va `range=30days|this_month|last_month|this_year|all_time`; doanh thu tinh tren so tien sau giam gia voi `totalRevenue/instructorRevenue = 80%`, `adminRevenue = 20%`, `grossRevenue = 100%`; mot so khoi UI duoc danh dau `MOCKDATA` neu backend chua co du lieu that)

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
