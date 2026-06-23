# Public Courses Query Optimization Design

## Goal

Reduce latency for `GET /public/courses` used by `http://localhost:5173/course-grid` without changing the frontend route, request parameters, or response shape.

## Current Problem

The current implementation loads the published courses list first, then runs two extra queries per course:

- one query to calculate `averageRating`
- one query to calculate `totalLessons`

This creates an N+1 query pattern:

- 1 base query for courses
- 2 additional queries for each returned course

As the number of courses grows, response time increases sharply.

## Chosen Approach

Optimize only the backend for `GET /public/courses` by replacing the per-course loop queries with a single aggregate query flow.

We will:

- keep the endpoint URL unchanged: `GET /public/courses`
- keep existing filters: `search`, `categoryId`, `price`
- keep `trangThai = 'PUBLISHED'`
- keep the response fields already consumed by the frontend, including:
  - course fields
  - `giangVien`
  - `danhMuc`
  - `averageRating`
  - `totalLessons`

## Implementation Notes

- Update only [backend/src/modules/courses/controllers/public-courses.controller.ts](/D:/VSC/TTTN_E-Learning-Platform/backend/src/modules/courses/controllers/public-courses.controller.ts:1)
- Remove the `for ... of courses` loop that executes extra SQL per course
- Replace it with aggregate subqueries or grouped joins so rating and lesson counts are computed in bulk
- Preserve output compatibility for the existing frontend components that read:
  - `data.averageRating`
  - `data.totalLessons`
  - `data.giangVien`
  - `data.danhMuc`

## Out of Scope

- No frontend changes
- No pagination changes
- No cache layer
- No API contract changes
- No optimization of `GET /public/courses/:id` or curriculum endpoints in this task

## Verification

- `GET /public/courses` still returns the same response shape expected by `CourseItemsGrid`
- Filters still behave the same
- Backend build passes
- The endpoint no longer performs per-course aggregate queries in application code
