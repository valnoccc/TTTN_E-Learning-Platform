# Frontend Agent Guide

This document serves as a specialized instruction manual for AI agents and developers working exclusively on the frontend repository. It defines the core technology stack, strict architectural rules, and mandatory verification steps.

## Technology Stack
- **Core Framework:** React (Functional Components with Hooks)
- **Build Tool:** Vite
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit (Client State) & RTK Query (Server State / API Integration)

## Development Rules

- **Data Fetching:** Strictly use **RTK Query** for all server data fetching, caching, and mutations. 
- **State Separation:** Use Redux `slices` *only* for global client UI state (e.g., theme, sidebar toggles) or Authentication state (e.g., storing the JWT). Do not duplicate or manually manage server data within standard Redux slices.
- **Component Purity:** Do not call APIs directly (using `fetch` or `axios`) inside React components. Always consume auto-generated RTK Query hooks (e.g., `useGetCoursesQuery`).
- **Code Organization:** Keep feature-specific code properly encapsulated. Group related components, hooks, and utilities logically by domain or feature (e.g., under `src/features/` or the designated domain folders).
- **Styling Consistency:** Exclusively use Tailwind CSS utility classes for styling. Avoid writing custom CSS in `.css` files unless absolutely necessary for complex animations or third-party library overrides.

## Verification Pipeline

Before completing any task, finalizing a feature, or submitting a Pull Request, the following verification pipeline must be executed successfully:

- `npm run lint` (Ensures the code adheres to all ESLint rules and formatting standards).
- `npm run typecheck` (Verifies that there are no TypeScript compilation or type-mismatch errors).
- `npm run test` (Executes and passes all Vitest / React Testing Library unit and component tests).
- `npm run build` (Ensures that the Vite production build compiles successfully without errors or memory leaks).