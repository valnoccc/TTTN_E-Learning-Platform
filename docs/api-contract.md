# API Contract

Source of truth:
- Swagger: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api-json`

## Auth & Account (Quan ly tai khoan)
- `POST /auth/register`
- `POST /instructor-applications/me` (Nguoi dung da dang nhap gui ho so giang vien; luu vao `HoSoGiangVien` va chuyen role sang `INSTRUCTOR` ngay, tra ve JWT moi)
- `GET /instructor-applications/policy` (Lay ty le chia doanh thu hien tai de hien thi truoc khi nguoi dung xac nhan dang ky giang vien)
- `POST /instructor-applications/me` ho tro them `BangCaps[]` va `KinhNghiems[]`; moi phan tu duoc luu vao bang con theo `MaHoSo` va giu thu tu bang `ThuTu`
- `POST /auth/login`
- `GET /auth/me`
- `PATCH /auth/profile` (Cap nhat thong tin ca nhan/tieu su)
- `PATCH /auth/change-password` (Doi mat khau)
- `POST /auth/forgot-password` (Khoi phuc mat khau)

## Users (Admin - Quan ly nguoi dung)
- `GET /admin/dashboard/stats` (Admin - Lay thong ke dashboard; `adminRevenue` va `instructorPayout` duoc tinh theo `ADMIN_REVENUE_PERCENT` va `INSTRUCTOR_REVENUE_PERCENT` trong backend `.env`)
- `GET /admin/dashboard/debts?month=MM&year=YYYY` (Admin - Lay cong no giang vien theo thang; `debtAmount` duoc tinh theo ty le hoa hong dang cau hinh)
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

Video upload uses immutable GCS objects. A replacement is stored as `DRAFT`
in `VideoBaiHoc` and becomes `PUBLIC` only after course approval; the previous
public object becomes `ARCHIVED`. `BaiHoc.VideoURL` remains the compatibility
pointer to the current public object. Existing data can be initialized with
`draft/db/sql/versioned-gcs-video-tidb.sql` followed by
`draft/db/sql/backfill-versioned-gcs-video-tidb.sql`.

## Quiz Questions (Ngan hang cau hoi trac nghiem)
- Database prerequisite: run `draft/db/sql/quiz-module-tidb.sql` once on the TiDB application schema before using these endpoints.
- `GET /courses/chapters/:chapterId/questions` (Instructor - Xem danh sach cau hoi cua chuong)
- `POST /courses/chapters/:chapterId/questions` (Instructor - Tao cau hoi voi dung 4 dap an; body: `{ noiDung, dapAnA, dapAnB, dapAnC, dapAnD, dapAnDung: 'A' | 'B' | 'C' | 'D', thuTu }`)
- `PATCH /courses/chapters/:chapterId/questions/:questionId` (Instructor - Sua cau hoi cua chuong; body cho phep cac truong tren)
- `DELETE /courses/chapters/:chapterId/questions/:questionId` (Instructor - Xoa cau hoi cua chuong)

## Quiz Attempts (Lich su lam bai cua hoc vien)
- Database prerequisite: the combined prerequisite is available at `draft/db/sql/quiz-module-tidb.sql`.
- `GET /student/chapters/:chapterId/access` (Student - Kiem tra quyen vao chuong theo ket qua chuong truoc; response gom `canAccess` va `quizPassed`)
- `POST /student/chapters/:chapterId/quiz-attempts` (Student - Tao mot lan lam bai moi; duoc lam lai)
- `POST /student/quiz-attempts/:attemptId/submit` (Student - Nop bai; body: `{ answers: [{ maCauHoi, dapAnChon: 'A' | 'B' | 'C' | 'D' | null }] }`)
- `GET /student/chapters/:chapterId/quiz-history` (Student - Xem lich su cac lan lam bai)
- Dieu kien dat: `SoCauDung * 100 > TongSoCau * 50`, tuc la phai dung tren 50% cau hoi.

## Forum (Cong dong)
- `GET /forum/questions` (Public - Danh sach topic)
- `GET /forum/questions/:id` (Public - Chi tiet topic)
- `GET /forum/admin/questions` (Admin - Danh sach topic cap 1, ho tro `search`, `page`, `limit`, tra ve `summary`)
- `DELETE /forum/admin/questions/:id` (Admin - Xoa topic cap 1 va cac tra loi lien quan theo cascade)

## Enrollments & Progress (Giao dich & Tien do)
- `POST /enrollments` (Dang ky mua/Thanh toan khoa hoc)
- `GET /enrollments/me` (Xem danh sach khoa hoc da mua & lich su giao dich)
- `GET /enrollments/:courseId/status` (Kiem tra trang thai mua khoa hoc)
- `PATCH /enrollments/:courseId/progress` (He thong tu dong cap nhat tien do xem video)
- `POST /coupons/validate` (Kiem tra ma giam gia cho gio hang dang checkout, body: `{ maCode: string, courseIds: number[] }`)
- `POST /coupons/:id/consume` (Tam thoi cap nhat `SoLuongDaDung` sau khi frontend mock payment thanh cong; can thay bang luong payment backend that khi co)
- `POST /checkout/momo/return` (Student - Xac thuc payload return co chu ky tu MoMo va dong bo trang thai hoa don; body la query params MoMo tra ve, response gom `invoiceId`, `resultCode`, `paymentStatus`)
- `DELETE /admin/coupons/:id` (Admin - Xoa cung coupon neu chua co luot su dung; neu da co `SoLuongDaDung > 0` thi tra loi chan xoa)

## Certificates (Chung chi)
- `POST /users/me/certificates/:courseId/issue` (Student - Cap hoac lay chung chi neu da hoan thanh toan bo bai hoc va moi chuong co quiz dat tren 70%; chuong khong co quiz duoc bo qua)
- `GET /users/me/certificates` (Student - Danh sach chung chi cua toi)
- `GET /users/me/certificates/:courseId` (Student - Chi tiet chung chi theo khoa hoc)
- `GET /users/me/certificates/by-id/:certificateId` (Student - Chi tiet chung chi theo ma chung chi)

## Submissions & Grading (Thuc hanh & Cham diem)
- `POST /lessons/:lessonId/submissions` (Student - Nop bai tap qua link GitHub)
- `GET /instructor/courses/:courseId/submissions` (Instructor - Xem danh sach bai nop cua hoc vien)
- `PATCH /submissions/:id/grade` (Instructor - Cham diem Dat/Khong dat & nhap nhan xet)
- `GET /submissions/me` (Student - Xem ket qua & phan hoi tu giang vien)

## Instructors (Giang vien)
- `GET /instructors/me/courses` (Lay danh sach khoa hoc cua giang vien)
- `GET /instructors/me/profile` (Lay ho so giang vien kem danh sach bang cap va kinh nghiem)
- `PATCH /instructors/me/profile` (Cap nhat ho so va thay the danh sach `BangCaps[]`, `KinhNghiems[]` neu duoc gui)
- `GET /instructors/me/transactions` (Giang vien - Danh sach giao dich da thanh toan theo tung dong chi tiet hoa don; ho tro `courseId` va `search`, chi tra ve cac khoa hoc cua giang vien hien tai)
- `GET /instructors/me/reports` (Lay du lieu trang bao cao giang vien; ho tro `courseId` va `range=30days|this_month|last_month|this_year|all_time`; doanh thu tinh theo ty le trong backend `.env`, `grossRevenue = 100%`; mot so khoi UI duoc danh dau `MOCKDATA` neu backend chua co du lieu that)
- `GET /instructors/me/attention-summary` (Giang vien - Tra ve `unansweredQuestions` va `unrespondedReviews` de hien thi badge can xu ly tren sidebar)

## Quiz questions
- `GET /admin/courses/:courseId/quiz-questions` (Admin - Xem danh sach cau hoi, 4 dap an va dap an dung theo tung chuong khi kiem duyet khoa hoc)

## Checkout / VNPay
- `POST /checkout/vnpay/create-payment` (Student - Tao hoa don `PENDING` va URL thanh toan VNPay)
- `POST /checkout/payment/cancel` (Student - Huy hoa don `PENDING` cua chinh minh cho VNPAY/MOMO khi quay lai bo thanh toan)
- `GET /checkout/vnpay/return` (VNPay - Xac nhan ket qua redirect; thanh cong chuyen `PENDING` thanh `PAID`)

## Notifications (Thong bao)
- `GET /notifications` (Lay danh sach thong bao cua toi, ho tro `limit`)
- `GET /notifications/unread-count` (Dem thong bao chua doc)
- `PATCH /notifications/:id/read` (Danh dau mot thong bao la da doc)
- `PATCH /notifications/read-all` (Danh dau tat ca thong bao la da doc)

## Articles / Blog (Bai viet)
- `GET /articles` (Public - Danh sach bai viet da xuat ban, uu tien bai `isPinned`; ho tro `page`, `limit`, `search`, `category=ANNOUNCEMENT|SYSTEM_UPDATE|PROMOTION|NEWS`)
- `GET /articles/:id` (Public - Chi tiet bai viet da xuat ban theo ID)
- `POST /articles` (Admin - Tao thong bao/tin tuc; tac gia lay tu JWT)
- `PUT /articles/:id` (Admin - Cap nhat moi bai viet, bao gom `isPinned`)
- `DELETE /articles/:id` (Admin - Xoa bai viet)
- Tuong thich UI cu: `GET /posts` va `GET /posts/:slug` van duoc duy tri; `GET /posts` cung ho tro filter `category`.

## Rules
- Protected endpoints require `Bearer token` (JWT).
- Admin endpoints require `ADMIN` role.
- Instructor course/lesson mutations require `INSTRUCTOR` role.
- Student enrollments & submissions require `STUDENT` role (hoac role mac dinh khi user dang ky).
- Data Isolation: Giang vien chi duoc phep thao tac tren cac khoa hoc do chinh ho tao ra.
- Data Integrity: Khong duoc phep xoa cung khoa hoc/bai hoc neu da co hoc vien dang ky (`enrollments > 0`). Chuyen sang trang thai an (Soft Delete/Deactivate).
- Coupon rule: mot ma giam gia chi ap dung cho dung khoa hoc `MaKH` cua no; neu gio hang co nhieu khoa hoc thi chi giam tren khoa hoc khop ma.
- `PATCH /admin/courses/:id/ban` (Ban khoa hoc da xuat ban, body: `{ lyDo: string }`, chuyen trang thai sang `BANNED`, tao thong bao va luu lich su kiem duyet)
- `GET /courses/:id` (Instructor - Chi tiet khoa hoc do minh so huu; khi khoa hoc dang `BANNED`, response co them `banReason` lay tu ly do `BAN` moi nhat.)
- Quy tac `BANNED`: giang vien duoc cap nhat noi dung khoa hoc, chuong, bai hoc/video va cau hoi; chi duoc doi trang thai sang `PENDING` de gui duyet lai. Khong duoc xoa, luu tru hoac tam an khoa hoc dang bi dinh chi.
