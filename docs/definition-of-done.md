# Definition of Done (DoD)

This document outlines the strict criteria that must be met before a feature, task, or bug fix is considered entirely "Done". This ensures high code quality, maintainability, and seamless synchronization between the frontend and backend.

A task is considered complete **only when all of the following conditions are met**:

## 1. Implementation & Code Quality
- [ ] The core requirement or feature is fully implemented as specified in the issue/task description.
- [ ] Code conforms strictly to the project's [Coding Conventions](coding-conventions.md).
- [ ] Static analysis passes (no ESLint errors or warnings).
- [ ] TypeScript compiler passes (no `tsc` type-checking errors).
- [ ] No residual debugging code (e.g., `console.log`, dead code) is left behind.

## 2. Testing
- [ ] Relevant unit and/or component tests are added or updated to cover the new or modified logic.
- [ ] All existing and new unit tests pass successfully.
- [ ] End-to-End (E2E) tests pass for any changed or directly impacted user flows.

## 3. API & State Synchronization
- [ ] **If backend changes:** The API Contract (Swagger/OpenAPI documentation) is updated to accurately reflect new endpoints, DTOs, roles, or response payloads.
- [ ] **If API changes:** The corresponding RTK Query endpoints, API slices, and TypeScript types in the frontend are updated and verified to match the new API contract.

## 4. Documentation
- [ ] Internal code documentation (e.g., JSDoc comments) is provided for complex business logic.
- [ ] Project documentation (inside `docs/` or `README.md`) is updated if the feature alters system behavior, architectural flow, or requires new environment variables (`.env`).