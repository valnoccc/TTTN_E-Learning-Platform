# Revenue Share Dashboard Design

## Goal

Apply revenue split reporting based on net paid amount after discounts:

- Admin/platform share: 60%
- Instructor share: 40%

Keep the current admin dashboard and instructor reports UI intact, changing only the revenue values and small labels needed to make the split visible.

## Scope

- Backend admin dashboard revenue calculations
- Backend instructor reports revenue calculations
- Frontend dashboard typings
- Small UI label/value additions for the three revenue numbers
- Checkout split percent for new payments

## Revenue Basis

Revenue is calculated from the amount paid after discount.

For invoice line reporting, use:

```sql
lineNetRevenue = lineOriginalPrice * invoicePaidTotal / invoiceOriginalTotal
```

Then split:

```text
adminRevenue = lineNetRevenue * 0.6
instructorRevenue = lineNetRevenue * 0.4
grossRevenue = lineNetRevenue
```

If an old invoice has missing or zero totals, fall back to the course recorded price.

## UI Compatibility

- Keep existing dashboard layout.
- Keep `totalRevenue` as the primary revenue value for each role:
  - Admin: `adminRevenue`
  - Instructor: `instructorRevenue`
- Add `grossRevenue`, `adminRevenue`, and `instructorRevenue` to API payloads so UI can show all three without breaking old fields.
- Avoid broad visual redesign.

## Verification

- Backend tests for admin and instructor revenue expectations.
- Backend build.
- Frontend build or lint if UI typings are changed.
