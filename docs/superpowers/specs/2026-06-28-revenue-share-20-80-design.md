# Revenue Share 20-80 Design

## Goal

Change the platform revenue split from `admin 60% / instructor 40%` to `admin 20% / instructor 80%` without changing API shapes or frontend layouts.

## Scope

- Update backend revenue-share logic used when creating invoice details during checkout.
- Update backend reporting logic used by the admin dashboard.
- Update backend reporting logic used by instructor reports.
- Update tests and API contract documentation that still describe the old split.

## Out Of Scope

- Database schema changes.
- Frontend UI redesign.
- Historical data migration for old invoices already written to the database.

## Current Problem

The old split is hardcoded in multiple backend modules:

- `backend/src/modules/checkout/checkout.service.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/instructors/services/instructors.service.ts`
- `docs/api-contract.md`

Because the same business rule is duplicated, changing the split in one place would leave checkout, admin stats, and instructor reports inconsistent.

## Proposed Design

Introduce one shared backend constant module that exports:

- `ADMIN_REVENUE_SHARE = 0.2`
- `INSTRUCTOR_REVENUE_SHARE = 0.8`
- percent helpers for places that store `TiLeGiangVien` as a percent value

All affected services will consume these constants instead of hardcoded literals.

## Data Flow

1. Checkout computes `DoanhThuGiangVien` and `TiLeGiangVien` using the shared revenue-share constants.
2. Admin dashboard computes `totalRevenue`, `adminRevenue`, `instructorPayout`, top-course revenue, and top-instructor revenue using the shared constants.
3. Instructor reports compute `totalRevenue`, `adminRevenue`, `instructorRevenue`, revenue series, and recent enrollment amounts using the shared constants.

## Testing Strategy

- Update unit tests for admin dashboard stats to assert the new `20/80` split.
- Update unit tests for instructor reports to assert the new `20/80` split.
- Add a focused checkout unit test for invoice detail inserts so the stored instructor percentage also follows `80%`.

## Risks

- If historical invoice rows still contain the old `TiLeGiangVien`, reports based on stored line revenue may differ from reports recalculated from gross revenue. This change only affects new writes and current query-based calculations.
- Checkout has no existing unit coverage, so a focused regression test is needed before touching that logic.
