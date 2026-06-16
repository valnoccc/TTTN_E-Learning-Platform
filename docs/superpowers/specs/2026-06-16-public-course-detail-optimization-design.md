# Public Course Detail Optimization Design

## Goal

Reduce latency for `GET /public/courses/:id` used by the student course detail page without changing the frontend route, endpoint URL, or response shape.

## Current Problem

The current course detail endpoint performs several sequential data fetches:

- load the course with relations
- load instructor profile data from `HoSoGiangVien`
- load instructor aggregate stats from `CoursesService.getInstructorStats()`
- load course student count from `CoursesService.getCourseTotalStudents()`

This creates extra round trips to the database for one page request and increases time-to-first-byte for the course detail screen.

## Chosen Approach

Optimize only the backend for `GET /public/courses/:id`.

We will:

- keep the endpoint URL unchanged: `GET /public/courses/:id`
- keep `trangThai = 'PUBLISHED'`
- keep the existing response shape expected by `CourseDetails.tsx`
- reduce sequential queries by bulk-loading and aggregating related data in fewer database operations

## Implementation Notes

- Update only [backend/src/modules/courses/controllers/public-courses.controller.ts](/D:/VSC/TTTN_E-Learning-Platform/backend/src/modules/courses/controllers/public-courses.controller.ts:1)
- Replace the current multi-step fetch flow with a query strategy that:
  - loads the course and required relations
  - joins or batches instructor profile data
  - computes instructor totals in one aggregate query
  - computes course student totals without delegating to separate per-request helper calls
- Preserve output compatibility for the existing frontend fields, including:
  - `giangVien`
  - `danhMuc`
  - `totalStudents`
  - `tenKhoaHoc`
  - `giaBan`
  - `hinhThuNho`
  - `moTa`

## Out of Scope

- No frontend changes
- No new endpoint
- No pagination changes
- No cache layer
- No optimization of `curriculum` or `reviews` endpoints in this task

## Verification

- `GET /public/courses/:id` still returns the same response shape expected by `CourseDetails.tsx`
- Published-course gating still works
- Backend build passes
- The endpoint performs fewer sequential data fetches in application code
