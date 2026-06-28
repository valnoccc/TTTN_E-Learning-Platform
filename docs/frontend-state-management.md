# Frontend State Management

## State Strategy
Use Redux Toolkit for global client state.
Use RTK Query for server state and API caching.

## Use RTK Query For
- Course list
- Course detail
- Login/register API
- Current user profile
- Enrollment status
- My Learning courses
- Admin course management
- Admin user management
- Admin dashboard overview stats

## Use Local Component State For
- Form input before submit
- Modal open/close
- UI-only toggles
- Temporary filters before applying

## Do Not
- Do not call `fetch` directly inside components.
- Do not duplicate RTK Query server data into Redux slices.
- Do not store derived server data unless necessary.
- Do not create a global slice for data already owned by RTK Query.

## File Structure
frontend/src/
├─ api/                     # RTK Query APIs & API Configuration
│  ├─ baseApi.ts            # Base configuration for RTK Query (fetchBaseQuery)
│  ├─ authApi.ts            # API endpoints for authentication
│  ├─ coursesApi.ts         # API endpoints for courses
│  └─ enrollmentsApi.ts     # API endpoints for enrollments
├─ assets/                  # Static assets (images, icons, etc.)
├─ components/              # Shared/Reusable UI components
├─ layouts/                 # Layout components (Header, Sidebar, Main Layout)
├─ pages/                   # Page components grouped by Actor/Domain
│  ├─ admin/                # Admin pages
│  ├─ auth/                 # Login, Register, Forgot Password
│  ├─ instructor/           # Instructor dashboard, course management
│  ├─ student/              # Student learning pages, enrollments
│  └─ HomePage.tsx          # Landing page
├─ routes/                  # React Router configuration
├─ store/                   # Redux Store Configuration & Client State (Slices)
│  ├─ store.ts              # configureStore setup
│  ├─ providers.tsx         # Redux <Provider> wrapper component
│  └─ slices/               
│     └─ authSlice.ts       # Global state for Auth (e.g., storing JWT token)
├─ App.css
├─ App.tsx
├─ index.css
├─ main.tsx                 # Entry point (Wrap App with providers.tsx here)
└─ vite-env.d.ts
