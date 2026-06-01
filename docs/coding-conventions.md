# Coding Conventions

This document outlines the coding standards and best practices for the project. Adhering to these conventions ensures code consistency, maintainability, and scalability across the entire codebase.

## TypeScript
- **Strict Typing:** Always enable and enforce strict mode. Define explicit interfaces or types for objects, API responses, and function parameters.
- **Avoid `any`:** Do not use `any` unless absolutely necessary (e.g., interfacing with poorly typed third-party libraries). Use `unknown` if the type is truly dynamic and type-narrow it later.
- **Exports:** Prefer named exports over default exports for shared utilities, constants, and types to ensure consistent naming during imports.
- **Single Responsibility:** Keep files focused on a single purpose. If a file grows too large, refactor and split it into smaller, logically grouped modules.

## React (Frontend)
- **Component Style:** Use functional components exclusively with React Hooks. Do not use class-based components.
- **Data Fetching & Server State:** Use **RTK Query** for all API data fetching, caching, and server state synchronization. Do not call `fetch` or `axios` directly inside components.
- **State Management:** Keep UI state (e.g., modal visibility, form input values before submission, toggle states) local using `useState` or `useReducer`. Only use Redux Toolkit global slices for truly global client state (e.g., user authentication token, theme).
- **Reusability:** Extract repeatable UI elements (e.g., Buttons, Inputs, Cards, Modals) into the `src/shared/components` directory to maintain a consistent design system.
- **Props:** Destructure props in the function signature for better readability.

## NestJS (Backend)
- **Separation of Concerns:** - **Controllers:** Strictly handle HTTP request routing, reading parameters/body, and returning HTTP responses. Do not put business logic here.
  - **Services:** Contain the core business logic. Controllers should call services to execute tasks.
- **Validation:** Use **DTOs** (Data Transfer Objects) combined with `class-validator` and `class-transformer` to validate and transform incoming request payloads at the controller level.
- **Security & Authorization:** Use **Guards** to handle authentication (e.g., JWT validation) and role-based access control (RBAC). Do not mix auth logic into services or controllers.
- **Database Access:** All interactions with the database using **Prisma ORM** must be isolated within Services (or specific Repository classes if the domain is complex). Controllers should never inject or call Prisma directly.