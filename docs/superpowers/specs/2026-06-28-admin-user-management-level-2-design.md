# Admin User Management Level 2 Design

## Goal

Upgrade the admin user management page into a practical operations console with search, filters, bulk actions, an insight drawer, and audit visibility.

## Scope

- Improve the admin user management page UI and information hierarchy.
- Add filters, bulk operations, and a right-side detail drawer.
- Surface basic KPI cards and audit/history context for each user.
- Keep the existing navigation, route structure, and role-based access model.

## Out Of Scope

- Changing backend auth model or permissions policy.
- Rebuilding unrelated admin pages.
- Replacing the current table-based interaction model with a card-only layout.

## Current State

The existing admin user management surface is mostly a list-and-action page. It can support user operations, but it does not yet provide the density, discoverability, or batching tools needed for repeated admin work.

## Design Read

Reading this as: admin operations console for support staff, with a trust-first dense data language, leaning toward a clean table-first layout plus a right-side detail drawer.

## Proposed Experience

### Page Structure

- Top row with four or five KPI cards: total users, active users, locked users, instructors, and recently created users.
- A sticky controls row with search, role filter, status filter, date filter, and an export action.
- A primary data table with selectable rows and clear columns for name, email, role, status, created date, last activity, and actions.
- A right-side drawer that opens when a row is selected, showing a richer user profile without leaving the table.

### Key Interactions

- Search by name, email, phone, or user code.
- Filter by role, status, and creation date range.
- Bulk select rows for lock, unlock, or role change.
- Row actions for quick lock/unlock, role edit, and detail view.
- Drawer tabs for Overview, Learning, Payments, and Audit History.
- Export the current filtered result set to CSV.

### Visual Direction

- Keep the current admin shell and sidebar.
- Use a restrained palette with one primary accent color and clear semantic status colors.
- Prefer table-first hierarchy over card-heavy composition.
- Use the drawer to concentrate detail, not another full page.
- Make destructive actions visually distinct and always confirmation-gated.

## Data Flow

1. The page loads summary stats and the filtered user list.
2. Search and filters update the query state and re-fetch the list.
3. Selecting a row opens the drawer and loads user-specific detail.
4. Bulk actions submit the selected user IDs plus an action payload.
5. After a successful mutation, the page refreshes the table and the drawer content.

## Error Handling

- Empty states should explain how to populate the table or relax filters.
- Loading states should preserve table geometry with skeleton rows.
- Mutation failures should be shown inline or via toast, with the original selection preserved.
- Destructive actions must require confirmation and a reason where relevant.

## Testing Strategy

- Verify that search and filters update the visible user list.
- Verify that selecting a row opens the drawer with user-specific detail.
- Verify that bulk actions target all selected rows.
- Verify that lock, unlock, and role change actions refresh the list after success.
- Verify that empty and loading states render correctly.

## Acceptance Criteria

- Admin can search and filter users without leaving the page.
- Admin can perform single and bulk account actions.
- Admin can inspect user detail in a drawer without losing table context.
- Admin can export the currently filtered set.
- The page feels denser and more operational, but still consistent with the existing admin shell.
