# Backend Agent Guide

This document serves as a specialized instruction manual for AI agents and developers working exclusively on the backend repository. It defines the core technology stack, strict architectural boundaries, and mandatory verification steps.

## Technology Stack
- **Core Framework:** NestJS (Node.js)
- **Language:** TypeScript (Strict Mode)
- **Database ORM:** Prisma
- **Database Engine:** MySQL (hosted on TiDB)
- **API Documentation:** Swagger / OpenAPI

## Development Rules

- **Architectural Pattern:** Strictly adhere to a domain-driven, module-based NestJS architecture. Each distinct feature (e.g., `auth`, `courses`, `enrollments`) must have its own encapsulated Module.
- **Thin Controllers:** Controllers must remain lightweight. Their sole responsibilities are routing HTTP requests, extracting parameters/body payloads, invoking the appropriate Service layer methods, and returning HTTP responses. **Do not** write business logic inside Controllers.
- **Fat Services:** All core business rules, conditional logic, and database interactions (via Prisma) must be isolated within `@Injectable()` Services.
- **Strict Validation:** Always use Data Transfer Objects (DTOs) combined with `class-validator` and `class-transformer` to validate and sanitize incoming request payloads before they reach the service layer.
- **API Contract Maintenance:** Whenever an endpoint is created, modified, or deleted, you must immediately update the corresponding Swagger decorators (e.g., `@ApiProperty()`, `@ApiResponse()`, `@ApiOperation()`) in the Controller and DTOs to keep the API documentation accurate.
- **Database Schema Management:** If the database schema changes, you must update the `schema.prisma` file and generate the corresponding database migration files before modifying the service logic.

## Verification Pipeline

Before completing any backend task, finalizing a feature, or submitting a Pull Request, the following verification pipeline must be executed successfully:

- `npm run lint` (Ensures the code adheres to all ESLint rules, NestJS conventions, and formatting standards).
- `npm run test` (Executes and passes all Jest unit tests, specifically ensuring that isolated Service logic functions correctly without a live database).
- `npm run test:e2e` (Executes and passes all End-to-End tests using Supertest, verifying that the Controllers, Guards, Interceptors, and Database integrations work together flawlessly).