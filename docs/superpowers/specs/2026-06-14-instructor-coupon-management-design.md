# Instructor Coupon Management Design

## Goal
Add a new instructor-facing coupon management area based on `draft/qlgiamgia.html`, backed by the `MaGiamGia` table, and connect student checkout to real coupon validation from the database.

## Scope
- Add a new instructor menu item and route for coupon management.
- Build backend coupon APIs for instructor CRUD-lite and student checkout validation.
- Replace mock checkout coupon validation with real API calls.
- Keep changes isolated to coupon-related backend/frontend files plus the instructor navigation entry and API contract docs.

## Existing Constraints
- Backend in this repository follows NestJS modules with TypeORM entities plus `DataSource` raw SQL queries.
- Frontend instructor pages use `InstructorLayout`, `InstructorSidebar`, and direct `axiosClient` calls instead of RTK Query in current instructor flows.
- The current checkout coupon logic in `frontend/src/api/checkout.ts` is mocked and must be replaced.
- The worktree already contains unrelated local edits; coupon work must avoid modifying unrelated behavior.

## Data Model
Source table:

```sql
CREATE TABLE `MaGiamGia` (
  `MaCoupon` int NOT NULL AUTO_INCREMENT,
  `MaCode` varchar(50) NOT NULL,
  `GiaTriGiam` decimal(10,2) NOT NULL,
  `LoaiGiam` enum('PERCENT','AMOUNT') DEFAULT 'PERCENT',
  `TrangThai` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `NgayBatDau` datetime DEFAULT NULL,
  `NgayKetThuc` datetime DEFAULT NULL,
  `MaKH` int NOT NULL,
  `MaND_GiangVien` int NOT NULL,
  `SoLuongGioiHan` int DEFAULT NULL,
  `SoLuongDaDung` int DEFAULT '0',
  `GhiChu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaCoupon`),
  UNIQUE KEY `MaCode` (`MaCode`)
);
```

Interpretation:
- Each coupon belongs to exactly one course via `MaKH`.
- Each coupon belongs to exactly one instructor via `MaND_GiangVien`.
- `SoLuongGioiHan = NULL` means unlimited usage.
- `SoLuongDaDung` is incremented only after successful payment completion, not during validation.

## Business Rules
### Instructor-side rules
- Instructors can only view and manage coupons attached to their own courses.
- Instructors can create coupons only for courses they own.
- `MaCode` must be unique across the system.
- `LoaiGiam = PERCENT` accepts values from `1` to `99`.
- `LoaiGiam = AMOUNT` accepts positive numeric values greater than `0`.
- `NgayBatDau` and `NgayKetThuc` are optional, but when both exist then `NgayKetThuc` must be after `NgayBatDau`.
- Instructors can activate/deactivate coupons by updating `TrangThai`; no hard delete is required in this scope.

### Student checkout rules
- A coupon applies only to the course whose id matches `MaKH`.
- When checkout includes multiple courses, the coupon reduces only the matching course subtotal; all other courses remain full price.
- Validation must reject codes that are:
  - missing
  - inactive
  - not yet started
  - expired
  - exhausted (`SoLuongDaDung >= SoLuongGioiHan` when a limit exists)
  - not associated with any course in the current cart
- The discount cannot reduce the matching course subtotal below `0`.
- Checkout summary should clearly show the applied discount amount and final total.

## Backend Design
### New module
Create a dedicated `coupons` module under `backend/src/modules/coupons` with:
- `coupons.module.ts`
- `entities/coupon.entity.ts`
- `dto/create-coupon.dto.ts`
- `dto/query-coupons.dto.ts`
- `dto/update-coupon-status.dto.ts`
- `dto/validate-coupon.dto.ts`
- `controllers/instructor-coupons.controller.ts`
- `controllers/public-coupons.controller.ts`
- `services/coupons.service.ts`

### API responsibilities
Instructor APIs:
- `GET /instructor/coupons`
  - List instructor-owned coupons.
  - Support simple `search` by code and `status` filter.
  - Return summary metrics used by the page cards.
- `POST /instructor/coupons`
  - Create a new coupon for an instructor-owned course.
- `PATCH /instructor/coupons/:id/status`
  - Toggle `ACTIVE` / `INACTIVE` for an instructor-owned coupon.

Checkout/public API:
- `POST /coupons/validate`
  - Input: coupon code plus array of course ids in cart.
  - Output: coupon validity, matched course id, discount type, configured value, computed discount amount, and message.

Internal service support:
- `consumeCouponUsage(couponId: number, expectedInstructorId?: number | null)` style helper to increment `SoLuongDaDung` after successful payment flow.
- This helper should be reusable by the payment/enrollment flow without duplicating validation rules.

### Persistence approach
- Follow repository conventions already used in the backend: TypeORM entity registration plus `DataSource.query(...)` for shaped queries and ownership checks.
- Validate course ownership by checking `KhoaHoc.MaKH` and `KhoaHoc.MaND_GiangVien`.
- Keep SQL focused and explicit rather than introducing a new abstraction style.

## Frontend Design
### Navigation and routing
- Add a new instructor sidebar item: `Mã giảm giá`.
- Add a new route under `frontend/src/routes/InstructorRoutes.tsx`, likely `/instructor/coupons`.

### New instructor page
Create a new page under `frontend/src/pages/instructor/coupons` that mirrors the structure and styling intent of `draft/qlgiamgia.html`:
- header with title/subtitle
- create coupon button
- quick stats cards
- search/status filters
- coupon table
- creation modal

Recommended page split:
- `CouponManagement.tsx` page shell
- `hooks/useInstructorCoupons.ts` for data loading and actions
- small local interfaces/types colocated with the hook or page

### Page behavior
- Load instructor coupon list and summary metrics on first render.
- Load instructor course options for the creation form.
- Allow searching by code and filtering by status.
- Allow creating a coupon from the modal without page navigation.
- Allow toggling status from the table.
- Show useful validation and submission errors via existing toast pattern.

## Checkout Integration
- Replace the mock `validateCoupon` implementation in `frontend/src/api/checkout.ts` with a real `axiosClient.post('/coupons/validate', ...)`.
- Update the frontend coupon response typings to support:
  - `matchedCourseId`
  - `discountType` using backend values `PERCENT | AMOUNT`
  - configured discount value
  - computed discount amount
  - optional human-readable message
- Checkout page logic should calculate totals using the backend-computed discount amount to avoid frontend/backend mismatch.

## Error Handling
- Backend should return clear `BadRequestException`, `ForbiddenException`, or `NotFoundException` messages for invalid create/validate requests.
- Frontend should surface these messages in the instructor modal and checkout coupon apply action without crashing the page.
- Invalid coupon application should not wipe the cart or block checkout retry.

## Testing
Backend:
- Unit tests for coupon service validation logic.
- Controller/service tests for ownership and status/limit/date rule enforcement.

Frontend:
- Targeted tests only if the area already has a test pattern nearby; otherwise rely on lint/typecheck/build plus manual flow verification because current instructor pages appear light on test coverage.

Manual verification:
- Instructor can create an `ACTIVE` percentage coupon.
- Instructor can create an `AMOUNT` coupon.
- Instructor cannot create a coupon for another instructor's course.
- Expired or inactive code fails validation.
- Multi-course cart applies discount only to matching course.
- Successful payment path increments usage count.

## Documentation Updates
- Update `docs/api-contract.md` with the new coupon endpoints and the checkout validation contract.
- Update any state/API notes only if coupon integration changes a documented frontend API convention.

## Out of Scope
- Editing all coupon fields after creation.
- Hard deleting coupons.
- Affiliate tracking or UTM link analytics from the HTML mock.
- Cross-course or platform-wide coupons.
- Admin coupon moderation.
