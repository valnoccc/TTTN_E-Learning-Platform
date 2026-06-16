# Public Course Detail Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce latency for `GET /public/courses/:id` by removing sequential aggregate lookups while keeping the current course detail response shape unchanged.

**Architecture:** Keep the optimization inside the existing public courses controller. Replace the current pattern of loading a course and then performing separate profile and statistics queries with a single course query plus one aggregate query batch for instructor and course totals.

**Tech Stack:** NestJS, TypeORM, MySQL/TiDB

---

### Task 1: Optimize the public course detail endpoint

**Files:**
- Modify: `backend/src/modules/courses/controllers/public-courses.controller.ts`
- Verify: `frontend/src/features/student-portal/pages/courses/CourseDetails.tsx`

- [ ] **Step 1: Confirm the response fields the frontend depends on**

Check that `CourseDetails.tsx` reads these fields from `response.data`:

```tsx
maKH
tenKhoaHoc
hinhThuNho
giaBan
moTa
danhMuc
giangVien
totalStudents
baiHocs
updatedAt
```

- [ ] **Step 2: Keep the main course lookup but avoid post-processing through helper service calls**

Replace the current detail flow:

```ts
const course = await this.khoaHocRepository.findOne(...);
const hoSoList = await this.dataSource.query(...);
const stats = await this.coursesService.getInstructorStats(maND);
const courseTotalStudents = await this.coursesService.getCourseTotalStudents(course.maKH);
```

with:

```ts
const course = await this.khoaHocRepository.findOne(...);
const [profileRows, statsRows] = await Promise.all([
  this.dataSource.query(`SELECT ChuyenMon, TieuSu FROM HoSoGiangVien WHERE MaND = ?`, [maND]),
  this.dataSource.query(
    `SELECT
       (SELECT COUNT(*) FROM KhoaHoc WHERE MaND_GiangVien = ? AND TrangThai IN ('PUBLISHED', 'PENDING')) AS totalCourses,
       (SELECT COUNT(DISTINCT dk.MaND)
        FROM DangKyKhoaHoc dk
        JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
        WHERE kh.MaND_GiangVien = ? AND dk.TrangThai = 'ACTIVE') AS totalStudents,
       (SELECT COUNT(DISTINCT dk2.MaND)
        FROM DangKyKhoaHoc dk2
        WHERE dk2.MaKH = ? AND dk2.TrangThai = 'ACTIVE') AS courseTotalStudents`,
    [maND, maND, course.maKH],
  ),
]);
```

- [ ] **Step 3: Map the aggregated values back into the existing response shape**

Build `instructorData` and `responseData` with the same keys:

```ts
const hoSo = profileRows.length > 0 ? profileRows[0] : {};
const stats = statsRows[0] ?? {};

const instructorData = {
  ...course.giangVien,
  tenGiangVien: course.giangVien.hoTen,
  avatar: course.giangVien.anhDaiDien,
  chuyenMon: hoSo.ChuyenMon || null,
  tieuSu: hoSo.TieuSu || null,
  totalCourses: Number(stats.totalCourses ?? 0),
  totalStudents: Number(stats.totalStudents ?? 0),
};

const responseData = {
  ...course,
  giangVien: instructorData || course.giangVien,
  totalStudents: Number(stats.courseTotalStudents ?? 0),
};
```

- [ ] **Step 4: Remove the now-redundant service calls**

Delete:

```ts
this.coursesService.getInstructorStats(...)
this.coursesService.getCourseTotalStudents(...)
```

Expected result: the endpoint no longer performs helper-driven sequential stats lookups.

- [ ] **Step 5: Verify backend build passes**

Run:

```bash
rtk npm run build
```

Expected: `nest build` completes successfully.

- [ ] **Step 6: Spot-check response compatibility**

The endpoint must still return:

```json
{
  "message": "Lấy chi tiết khóa học thành công",
  "data": {
    "maKH": 1,
    "tenKhoaHoc": "...",
    "giangVien": {},
    "danhMuc": {},
    "totalStudents": 0
  }
}
```

The exact values may differ, but the shape must remain compatible with the current frontend.
