# Instructor Classic Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the instructor frontend around explicit React routes and classic admin-panel components that closely match `giangvien.html` while preserving all existing instructor logic and backend interactions.

**Architecture:** Keep the current React + Vite app and the `/instructor/*` role-guarded entry point. Split the instructor area into route-backed pages and a shared classic shell so each major screen can be opened, refreshed, and debugged independently. Reuse the existing axios-based API calls and local component state, but move the visual language to small-radius bordered panels, a dark fixed sidebar, and a simple top header.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, `react-router-dom@7`, `lucide-react`, existing `axiosClient`, `react-hot-toast`.

---

### Task 1: Replace the instructor route module with explicit page routes

**Files:**
- Modify: `frontend/src/routes/InstructorRoutes.tsx`
- Modify: `frontend/src/App.tsx` only if the route tree needs a redirect or a new nested import path
- Modify: `frontend/src/components/RoleBasedRoute.tsx` only if route guarding needs to account for a deeper instructor route tree

- [ ] **Step 1: Define the explicit instructor route map**

```tsx
<Route path="/" element={<InstructorDashboard />} />
<Route path="courses" element={<InstructorCourses />} />
<Route path="courses/new" element={<InstructorCourseCreate />} />
<Route path="courses/:id" element={<InstructorCourseDetail />} />
<Route path="courses/:id/overview" element={<InstructorCourseOverview />} />
<Route path="courses/:id/lessons" element={<InstructorCourseLessons />} />
<Route path="courses/:id/reviews" element={<InstructorCourseReviews />} />
<Route path="courses/:id/discussions" element={<InstructorCourseDiscussions />} />
<Route path="courses/:id/lessons/new" element={<InstructorLessonCreate />} />
<Route path="lessons/:lessonId/edit" element={<InstructorLessonEdit />} />
<Route path="students" element={<InstructorStudents />} />
<Route path="reports" element={<InstructorReports />} />
```

- [ ] **Step 2: Add the default redirect behavior for the course detail shell**

```tsx
<Route path="courses/:id" element={<InstructorCourseDetail />}>
  <Route index element={<Navigate to="overview" replace />} />
</Route>
```

- [ ] **Step 3: Verify the route tree compiles**

Run:

```bash
npm run build
```

Expected:

- build succeeds
- no route import or nested-route type errors

### Task 2: Build the classic instructor shell and sidebar

**Files:**
- Modify: `frontend/src/layouts/InstructorLayout.tsx`
- Modify: `frontend/src/components/common/InstructorSidebar.tsx`
- Create: `frontend/src/components/instructor/InstructorTopHeader.tsx`
- Create: `frontend/src/components/instructor/UserDropdown.tsx`

- [ ] **Step 1: Refactor the layout into a fixed sidebar plus scrollable content shell**

```tsx
export default function InstructorLayout({ children }: InstructorLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f4f7f6] text-[#2c3e50]">
      <InstructorSidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <InstructorTopHeader />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rebuild the sidebar to match the template language**

```tsx
const menuItems = [
  { label: 'Khóa học của tôi', path: '/instructor/courses', icon: <BookOpen size={18} /> },
  { label: 'Đánh giá học viên', path: '/instructor/students', icon: <Users size={18} /> },
  { label: 'Báo cáo & Thống kê', path: '/instructor/reports', icon: <BarChart3 size={18} /> },
];
```

Use the existing user data source and keep the logout action behavior unchanged.

- [ ] **Step 3: Add a dedicated top header component**

```tsx
export default function InstructorTopHeader() {
  return (
    <header className="flex h-[60px] items-center border-b border-[#d1d7dc] bg-white px-6">
      <div className="text-[1.2rem] font-bold text-[#2c3e50]">
        Bảng điều khiển Giảng viên
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Verify the shell renders across all instructor routes**

Run:

```bash
npm run build
```

Expected:

- layout compiles
- sidebar active-state logic still works

### Task 3: Split course management into route-backed pages

**Files:**
- Modify: `frontend/src/pages/instructor/InstructorCourses.tsx`
- Modify: `frontend/src/pages/instructor/InstructorCourseDetail.tsx`
- Create: `frontend/src/pages/instructor/InstructorCourseCreate.tsx`
- Create: `frontend/src/pages/instructor/courses/InstructorCourseOverview.tsx`
- Create: `frontend/src/pages/instructor/courses/InstructorCourseLessons.tsx`
- Create: `frontend/src/pages/instructor/courses/InstructorCourseReviews.tsx`
- Create: `frontend/src/pages/instructor/courses/InstructorCourseDiscussions.tsx`
- Create: `frontend/src/components/instructor/ClassicTabs.tsx`
- Create: `frontend/src/components/instructor/ClassicCard.tsx`
- Create: `frontend/src/components/instructor/ClassicTable.tsx`
- Create: `frontend/src/components/instructor/ClassicButton.tsx`

- [ ] **Step 1: Rework the course list page into a bordered table/list layout**

```tsx
export default function InstructorCourses() {
  return (
    <InstructorLayout>
      <section className="mb-5 flex items-center justify-between">
        <h1 className="text-[1.8rem] font-bold text-[#2c3e50]">Khóa học của tôi</h1>
        <Link className="btn btn-primary" to="/instructor/courses/new">
          <PlusCircle size={16} /> Thêm khóa học mới
        </Link>
      </section>
      <ClassicCard>
        <ClassicTable ... />
      </ClassicCard>
    </InstructorLayout>
  );
}
```

Keep the current fetch/delete/toggle-status logic, only changing the presentation and route targets.

- [ ] **Step 2: Move create-course behavior into a dedicated create page**

```tsx
export default function InstructorCourseCreate() {
  return (
    <InstructorLayout>
      <ClassicCard>
        {/* reuse the current course form and save logic */}
      </ClassicCard>
    </InstructorLayout>
  );
}
```

Use the existing course mutation flow already present in `InstructorCourseDetail.tsx`, but isolate the new-course branch into a separate page for simpler debugging.

- [ ] **Step 3: Turn course detail into a route-backed shell with nested tabs**

```tsx
export default function InstructorCourseDetail() {
  return (
    <InstructorLayout>
      <section className="mb-5 border border-[#d1d7dc] bg-white p-6">
        {/* title, status line, and actions */}
      </section>
      <ClassicTabs />
      <Outlet />
    </InstructorLayout>
  );
}
```

Keep the current data loading logic for the course, lessons, save, delete, and status transitions, but move each visible tab into its own route component.

- [ ] **Step 4: Implement the overview, lessons, reviews, and discussion tab pages**

```tsx
export default function InstructorCourseOverview() {
  return <ClassicCard>{/* description + edit button */}</ClassicCard>;
}
```

```tsx
export default function InstructorCourseLessons() {
  return <ClassicCard>{/* lesson list built from existing lessons state */}</ClassicCard>;
}
```

```tsx
export default function InstructorCourseReviews() {
  return <ClassicCard>{/* existing review placeholder or fetched data */}</ClassicCard>;
}
```

```tsx
export default function InstructorCourseDiscussions() {
  return <ClassicCard>{/* existing question/comment placeholder or fetched data */}</ClassicCard>;
}
```

- [ ] **Step 5: Verify route navigation and nested refresh behavior**

Run:

```bash
npm run build
```

Expected:

- direct visits to `/instructor/courses/:id/overview` and sibling tabs work
- refresh on a nested tab does not lose the active tab

### Task 4: Reformat lesson create/edit screens to the template style

**Files:**
- Modify: `frontend/src/pages/instructor/AddLesson.tsx`
- Modify: `frontend/src/pages/instructor/LessonDetail.tsx`
- Create: `frontend/src/pages/instructor/lessons/InstructorLessonCreate.tsx`
- Create: `frontend/src/pages/instructor/lessons/InstructorLessonEdit.tsx`
- Create: `frontend/src/components/instructor/ClassicFormField.tsx`
- Create: `frontend/src/components/instructor/ClassicPanelNote.tsx`

- [ ] **Step 1: Move lesson creation into a dedicated route page**

```tsx
export default function InstructorLessonCreate() {
  return (
    <InstructorLayout>
      {/* keep the current FormData upload logic and preview state */}
    </InstructorLayout>
  );
}
```

- [ ] **Step 2: Move lesson editing into a dedicated route page**

```tsx
export default function InstructorLessonEdit() {
  return (
    <InstructorLayout>
      {/* keep the current fetch-by-id and update logic */}
    </InstructorLayout>
  );
}
```

- [ ] **Step 3: Restyle lesson form sections with classic bordered panels**

```tsx
<section className="border border-[#d1d7dc] bg-white p-6">
  <h3 className="mb-6 text-lg font-bold text-[#2c3e50]">Thông tin bài học</h3>
  ...
</section>
```

- [ ] **Step 4: Verify upload, preview, and save flows still work**

Run:

```bash
npm run build
```

Expected:

- form pages compile
- upload preview logic remains intact

### Task 5: Restyle student management and reports pages to the same panel system

**Files:**
- Modify: `frontend/src/pages/instructor/InstructorStudents.tsx`
- Create: `frontend/src/pages/instructor/InstructorReports.tsx`
- Create: `frontend/src/components/instructor/ClassicFilterBar.tsx`

- [ ] **Step 1: Restyle the student management page into a search + filter + table layout**

```tsx
export default function InstructorStudents() {
  return (
    <InstructorLayout>
      <section className="border border-[#d1d7dc] bg-white p-5">
        {/* search, select, and filter button */}
      </section>
      <ClassicCard>
        {/* student list */}
      </ClassicCard>
    </InstructorLayout>
  );
}
```

Keep the current course filter, search input, and API fetch behavior unchanged.

- [ ] **Step 2: Add a reports page with the same classic visual language**

```tsx
export default function InstructorReports() {
  return (
    <InstructorLayout>
      <ClassicCard>
        <h1 className="text-[1.8rem] font-bold text-[#2c3e50]">Báo cáo & Thống kê</h1>
      </ClassicCard>
    </InstructorLayout>
  );
}
```

This page can start with a simple layout placeholder if the backend/reporting data source is not yet wired.

- [ ] **Step 3: Verify the two pages compile**

Run:

```bash
npm run build
```

Expected:

- student management renders in the new visual system
- reports route exists and does not break navigation

### Task 6: Normalize shared styling and remove leftover modern-dashboard visual noise

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.css` only if the global app shell introduces style conflicts
- Modify: `frontend/src/components/ui/CourseCard.tsx` only if it is reused inside instructor pages and must match the classic surface style

- [ ] **Step 1: Define reusable classic surface classes or Tailwind tokens**

```css
/* Keep the instructor area conservative and template-like */
.classic-panel {
  border: 1px solid #d1d7dc;
  border-radius: 2px;
  background: #fff;
}
```

- [ ] **Step 2: Remove or reduce any lingering shadow-heavy instructor styles**

```tsx
className="rounded-md border border-[#d1d7dc] bg-white shadow-none"
```

- [ ] **Step 3: Verify the global style changes do not affect student/admin pages unexpectedly**

Run:

```bash
npm run build
```

Expected:

- instructor pages keep the classic look
- other areas still compile and render as before

### Task 7: Verify the instructor flow end-to-end and capture the result

**Files:**
- Modify: only files changed by the tasks above

- [ ] **Step 1: Run the project checks relevant to the frontend**

Run:

```bash
npm run lint
npm run build
```

Expected:

- lint passes
- build passes

- [ ] **Step 2: Smoke test the instructor routes**

Open and verify these paths:

```text
/instructor
/instructor/courses
/instructor/courses/new
/instructor/courses/:id/overview
/instructor/courses/:id/lessons
/instructor/courses/:id/reviews
/instructor/courses/:id/discussions
/instructor/courses/:id/lessons/new
/instructor/lessons/:lessonId/edit
/instructor/students
/instructor/reports
```

Expected:

- no broken navigation
- route-specific content renders under the classic shell
- refresh on nested routes works

- [ ] **Step 3: Commit the implementation in a single logical checkpoint**

```bash
git add frontend/src docs/superpowers/plans/2026-06-04-instructor-classic-panel-redesign.md
git commit -m "feat: redesign instructor panel routes"
```

Expected:

- one clean commit for the route/UI refactor
- spec and implementation plan remain in sync
