# Public Courses Query Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce latency for `GET /public/courses` by removing the per-course aggregate query loop while keeping the same API shape for the student course grid.

**Architecture:** Keep the optimization inside the existing public courses controller. Replace the current `getMany() + per-course SQL loop` with one aggregate query that joins instructor and category data and computes `averageRating` and `totalLessons` in bulk via grouped subqueries.

**Tech Stack:** NestJS, TypeORM QueryBuilder, MySQL/TiDB

---

### Task 1: Replace N+1 aggregation in the public courses list endpoint

**Files:**
- Modify: `backend/src/modules/courses/controllers/public-courses.controller.ts`
- Verify: `frontend/src/features/student-portal/pages/courses/components/CourseItemsGrid.tsx`

- [ ] **Step 1: Inspect the response fields the frontend depends on**

Confirm the list page reads these keys from each course item:

```tsx
data.maKH
data.tenKhoaHoc
data.moTa
data.giaBan
data.hinhThuNho
data.averageRating
data.totalLessons
data.giangVien?.hoTen
data.giangVien?.anhDaiDien
data.danhMuc?.tenDM
```

- [ ] **Step 2: Replace the current looped aggregate logic with a single bulk query**

Update `getAllCourses()` so it:

```ts
const query = this.khoaHocRepository
  .createQueryBuilder('khoaHoc')
  .leftJoinAndSelect('khoaHoc.giangVien', 'giangVien')
  .leftJoinAndSelect('khoaHoc.danhMuc', 'danhMuc')
  .leftJoin(
    qb =>
      qb
        .from('DanhGiaKhoaHoc', 'dg')
        .select('dg.MaKH', 'maKH')
        .addSelect('AVG(dg.SoSao)', 'avgRating')
        .where('dg.SoSao > 0')
        .groupBy('dg.MaKH'),
    'ratings',
    'ratings.maKH = khoaHoc.maKH',
  )
  .leftJoin(
    qb =>
      qb
        .from('BaiHoc', 'bh')
        .innerJoin('ChuongHoc', 'ch', 'bh.MaChuong = ch.MaChuong')
        .select('ch.MaKH', 'maKH')
        .addSelect('COUNT(*)', 'lessonCount')
        .where(`bh.TrangThai = 'ACTIVE'`)
        .groupBy('ch.MaKH'),
    'lessonStats',
    'lessonStats.maKH = khoaHoc.maKH',
  )
  .where('khoaHoc.trangThai = :status', { status: 'PUBLISHED' })
  .orderBy('khoaHoc.maKH', 'DESC')
  .addSelect('ratings.avgRating', 'averageRating')
  .addSelect('lessonStats.lessonCount', 'totalLessons');
```

- [ ] **Step 3: Preserve existing filters and map raw aggregate values onto entity results**

After applying `search`, `categoryId`, and `price`, fetch both entities and raw rows:

```ts
const { entities, raw } = await query.getRawAndEntities();

const courses = entities.map((course, index) => ({
  ...course,
  averageRating: raw[index]?.averageRating
    ? Number(raw[index].averageRating).toFixed(1)
    : '0.0',
  totalLessons: raw[index]?.totalLessons
    ? Number(raw[index].totalLessons)
    : 0,
}));
```

- [ ] **Step 4: Remove the old per-course query loop completely**

Delete the current block:

```ts
for (const course of courses) {
  const avgResult = await this.dataSource.query(...);
  const lessonCountResult = await this.dataSource.query(...);
}
```

Expected result: no application-level per-course aggregate queries remain in `getAllCourses()`.

- [ ] **Step 5: Verify backend build passes**

Run:

```bash
rtk npm run build
```

Expected: `nest build` completes successfully.

- [ ] **Step 6: Spot-check response compatibility**

Verify the endpoint still returns:

```json
{
  "message": "Lấy danh sách khóa học thành công",
  "data": [
    {
      "maKH": 1,
      "tenKhoaHoc": "...",
      "averageRating": "4.5",
      "totalLessons": 12,
      "giangVien": {},
      "danhMuc": {}
    }
  ]
}
```

The exact values may differ, but the shape must remain compatible with the current frontend.
