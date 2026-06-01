# CodeGraph Guide

Use CodeGraph before broad code exploration.

## When to Use
- Finding files related to a feature.
- Finding where a function/class/module is used.
- Understanding frontend-to-backend flow.
- Impact analysis before refactor.
- Tracing from UI component to API endpoint.

## Common Queries
- Find symbols related to Course, Enrollment, Payment, Auth.
- Find callers of `createEnrollment`.
- Find callees of `CourseDetailPage`.
- Trace from `PurchaseButton` to backend enrollment API.
- Analyze impact of changing `CourseService`.

## Rules
- Start with CodeGraph context before opening many files.
- Use CodeGraph results to select files, not as final truth.
- Confirm behavior by reading source and tests.