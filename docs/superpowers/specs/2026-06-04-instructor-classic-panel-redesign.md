# Instructor Classic Panel Redesign Spec

## Goal

Replace the current instructor frontend presentation with a React + TypeScript + Vite + Tailwind implementation that closely matches `giangvien.html`, while keeping the existing instructor logic, API usage, and permission model unchanged.

The end result should feel like the original template:

- traditional admin-panel layout
- small border radius
- minimal shadow
- clear bordered sections
- fixed left sidebar
- simple top header
- content broken into explicit pages

## Non-Goals

- Do not change backend APIs.
- Do not change instructor business rules.
- Do not redesign the UI into a modern card-heavy style.
- Do not alter the existing auth/role guards.
- Do not migrate the instructor area to a different state-management pattern.

## Source Template

The reference is the local `giangvien.html` file in the repository root.

Important characteristics to preserve:

- 260px left sidebar
- dark sidebar background
- 60px top header
- white content background
- bordered panels with small radius
- table-based course list
- tabbed course-detail layout
- user dropdown in the sidebar footer

## Proposed Route Structure

The instructor area should be split into explicit routes so each view is independently navigable and debuggable.

### Primary routes

- `/instructor`
  - instructor dashboard / overview
- `/instructor/courses`
  - course list
- `/instructor/courses/new`
  - create course
- `/instructor/courses/:id`
  - course detail shell
- `/instructor/courses/:id/overview`
  - course summary tab
- `/instructor/courses/:id/lessons`
  - lesson list tab
- `/instructor/courses/:id/reviews`
  - student reviews tab
- `/instructor/courses/:id/discussions`
  - Q&A / comments tab
- `/instructor/courses/:id/lessons/new`
  - create lesson
- `/instructor/lessons/:lessonId/edit`
  - edit lesson
- `/instructor/students`
  - student management / evaluation
- `/instructor/reports`
  - reporting and analytics

### Route behavior

- The route structure must preserve the current role guard on `/instructor/*`.
- Existing API calls should continue to be made from the same logical features.
- `course detail` tabs should be route-backed rather than purely hidden DOM state, so direct links and refreshes work.

## Page Decomposition

Each page should be a focused component with one responsibility.

### Instructor dashboard

Purpose:

- show the high-level instructor overview
- keep the existing stats/summary logic

UI notes:

- section header at the top
- compact stat boxes
- bordered placeholder panels for charts or summaries

### Course list

Purpose:

- display instructor-owned courses
- expose navigation to course detail and create-course flow

UI notes:

- table or table-like list
- action buttons with simple borders
- status labels in a low-noise style

### Course create/edit

Purpose:

- preserve the current create/update course logic
- reuse the same form structure for new and existing courses where possible

UI notes:

- one main form panel
- one or two supporting panels in a two-column layout
- field labels should use uppercase small text, like the HTML template

### Course detail

Purpose:

- present course metadata
- show lesson list, reviews, and discussion areas in separate tabs/routes

UI notes:

- large title block
- status line beneath the title
- right-aligned action button area
- sub-navigation bar with active tab styling from the template

### Lesson create/edit

Purpose:

- preserve existing lesson mutation logic
- keep video upload and preview behavior intact

UI notes:

- bordered form sections
- plain file upload affordance
- compact helper panel on the side

### Student management

Purpose:

- preserve existing student list and filtering logic
- keep course filter and search behavior

UI notes:

- summary strip at the top
- search/filter row
- bordered result list with rows separated by lines

### Reports

Purpose:

- provide a dedicated page placeholder for instructor revenue/analytics
- allow future expansion without affecting course management pages

UI notes:

- follow the same template language even if the content is initially minimal

## Shared Layout Components

The template should be implemented through a small set of reusable layout primitives.

### Instructor shell

Responsibilities:

- render the fixed sidebar
- render the top header
- provide the content scroll area

Dependencies:

- current user data from local storage or the existing auth source
- router location for active-nav state

### Sidebar

Responsibilities:

- show the instructor brand block
- highlight the active route
- provide the footer dropdown with profile/settings/logout actions

Constraints:

- keep the sidebar dark
- avoid rounded cards inside the sidebar except for small controls
- keep the footer anchored to the bottom

### Classic panel primitives

Create reusable low-level UI pieces for consistency:

- `ClassicCard`
- `ClassicButton`
- `ClassicInput`
- `ClassicSelect`
- `ClassicTextarea`
- `ClassicTable`
- `ClassicTabs`
- `ClassicSectionTitle`
- `ClassicStatusBadge`

These primitives should be visually conservative and map closely to the HTML template.

## Data Flow

No backend flow changes are required.

Existing flow should remain:

- React page
- existing axios client or current API abstraction
- backend endpoint
- returned data rendered into the page

The redesign only changes route boundaries and UI composition.

## State Handling

The redesign should preserve the current state model.

- Use local component state for forms, menus, tab selection, previews, and loading flags.
- Keep API data fetching in the existing page logic unless a small shared hook is needed for reuse.
- Do not duplicate server state into a new global store just for the redesign.

## Visual Rules

The new instructor UI must intentionally stay close to the HTML template.

Allowed:

- `rounded-sm` or `rounded-md`
- `border`-first surfaces
- subtle hover states
- small, simple icons
- limited use of shadows

Avoid:

- large rounded corners
- gradient-heavy surfaces
- glassmorphism
- oversized shadows
- overly modern dashboard styling

## File Organization

Recommended frontend structure:

- `frontend/src/layouts/InstructorLayout.tsx`
- `frontend/src/components/common/InstructorSidebar.tsx`
- `frontend/src/components/instructor/ClassicCard.tsx`
- `frontend/src/components/instructor/ClassicTable.tsx`
- `frontend/src/components/instructor/ClassicTabs.tsx`
- `frontend/src/components/instructor/ClassicFormField.tsx`
- `frontend/src/pages/instructor/dashboard/InstructorDashboard.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourses.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourseCreate.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourseDetail.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourseOverview.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourseLessons.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourseReviews.tsx`
- `frontend/src/pages/instructor/courses/InstructorCourseDiscussions.tsx`
- `frontend/src/pages/instructor/lessons/InstructorLessonCreate.tsx`
- `frontend/src/pages/instructor/lessons/InstructorLessonEdit.tsx`
- `frontend/src/pages/instructor/students/InstructorStudents.tsx`
- `frontend/src/pages/instructor/reports/InstructorReports.tsx`

Existing instructor page files can be adapted in place if the repo prefers incremental refactoring, but the final structure should follow the route/page decomposition above.

## Testing Strategy

The redesign should be validated with:

- lint
- typecheck
- build
- route-level smoke testing

Recommended checks for the instructor area:

- `/instructor`
- `/instructor/courses`
- `/instructor/courses/new`
- `/instructor/courses/:id`
- `/instructor/courses/:id/lessons/new`
- `/instructor/lessons/:lessonId/edit`
- `/instructor/students`
- `/instructor/reports`

If automated UI tests exist for the instructor flow, update them to reflect the new route structure and stable selectors.

## Risks

- Route changes can break internal links if old paths are left behind.
- The course-detail tab split may require redirect defaults so direct visits land on the overview tab.
- Sidebar footer dropdown behavior needs careful handling so click-outside still works.
- The current instructor pages are already partially styled; avoid mixing the old visual language with the new template language in the same page.

## Acceptance Criteria

- Instructor pages visually match the template direction: classic, bordered, compact, low-shadow.
- The instructor area is split into explicit pages and route-backed tabs.
- Existing instructor logic continues to work without backend changes.
- The UI is easier to navigate, extend, and debug because each major view has its own route.
