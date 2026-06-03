# Student Edulyn Template Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/student` experience with ported UI pages from the Edulyn React template.

**Architecture:** Keep the existing Vite/React 19 app and the current role-based routing. Add a small student page set under the current FE, reuse the existing `MainLayout` shell where it fits, and port only the template pages that make sense for the student area. Use local public assets copied from the template so the pages render without external dependencies.

**Tech Stack:** React 19, TypeScript, Vite, `react-router-dom@7`, Tailwind CSS, `lucide-react`.

---

### Task 1: Replace the student route module

**Files:**
- Modify: `frontend/src/routes/StudentRoutes.tsx`
- Modify: `frontend/src/App.tsx` if route wiring needs a new import path
- Modify: `frontend/src/components/common/Navbar.tsx` only if the student destination needs a new label or path

- [ ] **Step 1: Define the new student route set**

```tsx
<Route path="/" element={<StudentHomePage />} />
<Route path="courses" element={<StudentCoursesPage />} />
<Route path="courses/:id" element={<StudentCourseDetailsPage />} />
<Route path="about" element={<StudentAboutPage />} />
<Route path="contact" element={<StudentContactPage />} />
<Route path="faq" element={<StudentFaqPage />} />
```

- [ ] **Step 2: Wire the module into the existing `/student/*` route**

Run: `npm run build`
Expected: build should still succeed after route changes.

- [ ] **Step 3: Verify the old `StudentDashboard` is no longer the student landing page**

Run: open `/student` in the browser after the change.
Expected: the new student home page loads instead of the legacy dashboard.

### Task 2: Add ported student pages and shared layout pieces

**Files:**
- Create: `frontend/src/pages/student/StudentHomePage.tsx`
- Create: `frontend/src/pages/student/StudentCoursesPage.tsx`
- Create: `frontend/src/pages/student/StudentCourseDetailsPage.tsx`
- Create: `frontend/src/pages/student/StudentAboutPage.tsx`
- Create: `frontend/src/pages/student/StudentContactPage.tsx`
- Create: `frontend/src/pages/student/StudentFaqPage.tsx`
- Create: `frontend/src/components/student/StudentHero.tsx`
- Create: `frontend/src/components/student/StudentSectionTitle.tsx`

- [ ] **Step 1: Build the student home page with template-inspired sections**

```tsx
export default function StudentHomePage() {
  return (
    <MainLayout>
      <StudentHero />
      <section className="mx-auto max-w-7xl px-6 py-16">
        ...
      </section>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Add the student courses and details pages**

```tsx
export default function StudentCoursesPage() {
  return <MainLayout>{/* course grid and filters */}</MainLayout>;
}

export default function StudentCourseDetailsPage() {
  return <MainLayout>{/* hero, curriculum, sidebar */}</MainLayout>;
}
```

- [ ] **Step 3: Add the supporting informational pages**

```tsx
export default function StudentAboutPage() {
  return <MainLayout>{/* about content */}</MainLayout>;
}
```

- [ ] **Step 4: Verify the new pages compile**

Run: `npm run build`
Expected: build succeeds with the new TSX pages.

### Task 3: Copy the template assets needed by the new pages

**Files:**
- Create or copy into: `frontend/public/assets/images/*` for only the images used by the new student pages

- [ ] **Step 1: Copy only the images referenced by the new student pages**

Example targets:
```text
frontend/public/assets/images/hero-bg.jpg
frontend/public/assets/images/course-1.jpg
frontend/public/assets/images/course-2.jpg
frontend/public/assets/images/about-1.jpg
frontend/public/assets/images/contact-banner.jpg
```

- [ ] **Step 2: Point the new pages at the copied assets**

Use `src="/assets/images/..."` in the student page markup.

- [ ] **Step 3: Verify the images resolve in the browser**

Open the student routes and confirm the hero and card images render.

