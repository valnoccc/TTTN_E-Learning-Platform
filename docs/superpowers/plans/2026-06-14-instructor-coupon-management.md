# Instructor Coupon Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build instructor coupon management backed by `MaGiamGia` and connect student checkout to live coupon validation and consumption.

**Architecture:** Add a dedicated NestJS `coupons` module using the repository plus raw SQL style already present in the backend, then add a focused instructor coupon page and sidebar route in the frontend. Reuse one backend validation path for both instructor visibility and checkout calculations so the discount shown in UI matches server logic.

**Tech Stack:** React, Vite, TypeScript, TailwindCSS, NestJS, TypeORM, MySQL/TiDB, axios

---

## File Map

- Create `backend/src/modules/coupons/coupons.module.ts` to register controllers, service, and entities.
- Create `backend/src/modules/coupons/entities/coupon.entity.ts` for `MaGiamGia`.
- Create `backend/src/modules/coupons/dto/create-coupon.dto.ts` for instructor create payload validation.
- Create `backend/src/modules/coupons/dto/query-coupons.dto.ts` for search/filter query parsing.
- Create `backend/src/modules/coupons/dto/update-coupon-status.dto.ts` for status toggle payload.
- Create `backend/src/modules/coupons/dto/validate-coupon.dto.ts` for checkout validation payload.
- Create `backend/src/modules/coupons/services/coupons.service.ts` for list/create/validate/consume logic.
- Create `backend/src/modules/coupons/controllers/instructor-coupons.controller.ts` for instructor endpoints.
- Create `backend/src/modules/coupons/controllers/public-coupons.controller.ts` for checkout validation endpoint.
- Modify `backend/src/app.module.ts` or the module registration file that wires feature modules into Nest.
- Modify the enrollment/payment path file(s) that finalize purchase so successful coupon usage increments `SoLuongDaDung`.
- Add backend tests near the new module, likely `backend/src/modules/coupons/coupons.service.spec.ts` and optionally controller specs if the repo pattern supports it.
- Create `frontend/src/pages/instructor/coupons/CouponManagement.tsx` for the page.
- Create `frontend/src/pages/instructor/coupons/hooks/useInstructorCoupons.ts` for page data and actions.
- Modify `frontend/src/components/common/InstructorSidebar.tsx` to add the new menu item.
- Modify `frontend/src/routes/InstructorRoutes.tsx` to add the new route.
- Modify `frontend/src/api/checkout.ts` to replace mocked coupon validation.
- Modify `frontend/src/features/student-portal/pages/checkout/Checkout.tsx` to use the live coupon response shape if needed.
- Modify `docs/api-contract.md` to document coupon endpoints.

## Task 1: Inspect payment finalization hook point

**Files:**
- Modify: exact backend purchase finalization file after discovery
- Test: note the matching spec or service test file after discovery

- [ ] **Step 1: Locate the real purchase completion code path**

Run: `rtk rg -n "processPayment|couponCode|DangKyKhoaHoc|HoaDon|ThanhToan|POST /enrollments|createEnrollment|TrangThaiThanhToan|PAID" backend/src frontend/src`
Expected: identify the backend service/controller that actually records successful purchases.

- [ ] **Step 2: Note the exact file and method where coupon usage should be consumed**

Record the method name and path in the working notes before editing any coupon code.

## Task 2: Add failing backend tests for coupon rules

**Files:**
- Create: `backend/src/modules/coupons/coupons.service.spec.ts`

- [ ] **Step 1: Write failing tests for create and validate rules**

Include tests for:

```ts
it('rejects percent coupons above 99', async () => {});
it('rejects coupon creation for a course the instructor does not own', async () => {});
it('rejects inactive coupons during checkout validation', async () => {});
it('applies a coupon only to the matching course in a multi-course cart', async () => {});
it('caps amount discount at the matching course subtotal', async () => {});
it('increments usage only when consumeCouponUsage is called', async () => {});
```

- [ ] **Step 2: Run the new test file to verify failure**

Run: `rtk npm test -- --runInBand coupons.service.spec.ts`
Expected: FAIL because coupon module/service does not exist yet.

## Task 3: Implement the backend coupon entity and DTOs

**Files:**
- Create: `backend/src/modules/coupons/entities/coupon.entity.ts`
- Create: `backend/src/modules/coupons/dto/create-coupon.dto.ts`
- Create: `backend/src/modules/coupons/dto/query-coupons.dto.ts`
- Create: `backend/src/modules/coupons/dto/update-coupon-status.dto.ts`
- Create: `backend/src/modules/coupons/dto/validate-coupon.dto.ts`

- [ ] **Step 1: Add the `Coupon` entity mapped to `MaGiamGia`**

Define columns for code, value, type, status, dates, course id, instructor id, limit, used count, and note.

- [ ] **Step 2: Add DTO validation rules**

Key rules:

```ts
@IsEnum(['PERCENT', 'AMOUNT'])
loaiGiam: 'PERCENT' | 'AMOUNT';

@ValidateIf((dto) => dto.loaiGiam === 'PERCENT')
@Min(1)
@Max(99)
giaTriGiam: number;
```

- [ ] **Step 3: Add validation payload for checkout**

Shape:

```ts
export class ValidateCouponDto {
  @IsString()
  maCode!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  courseIds!: number[];
}
```

## Task 4: Implement coupon service core logic

**Files:**
- Create: `backend/src/modules/coupons/services/coupons.service.ts`

- [ ] **Step 1: Implement instructor coupon listing with stats**

Return:

```ts
{
  summary: {
    activeCount: number;
    totalUsageCount: number;
    totalCouponCount: number;
  },
  items: [...]
}
```

- [ ] **Step 2: Implement coupon creation with ownership checks**

Use `KhoaHoc` ownership query:

```sql
SELECT MaKH, TenKhoaHoc
FROM KhoaHoc
WHERE MaKH = ? AND MaND_GiangVien = ?
```

- [ ] **Step 3: Implement checkout validation logic**

Return a response like:

```ts
{
  valid: true,
  couponId: 1,
  maCode: 'SUMMER50',
  matchedCourseId: 10,
  discountType: 'PERCENT',
  discountValue: 50,
  discountAmount: 150000,
  message: 'Áp dụng mã giảm giá thành công.'
}
```

- [ ] **Step 4: Implement `consumeCouponUsage`**

Update only after successful payment:

```sql
UPDATE MaGiamGia
SET SoLuongDaDung = SoLuongDaDung + 1
WHERE MaCoupon = ? AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)
```

- [ ] **Step 5: Run the coupon service tests**

Run: `rtk npm test -- --runInBand coupons.service.spec.ts`
Expected: coupon tests move to PASS or expose missing controller/module wiring.

## Task 5: Expose backend coupon endpoints

**Files:**
- Create: `backend/src/modules/coupons/controllers/instructor-coupons.controller.ts`
- Create: `backend/src/modules/coupons/controllers/public-coupons.controller.ts`
- Create: `backend/src/modules/coupons/coupons.module.ts`
- Modify: backend module registration file

- [ ] **Step 1: Add instructor controller endpoints**

Endpoints:

```ts
@Controller('instructor/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
```

- [ ] **Step 2: Add public/authenticated checkout validation endpoint**

Endpoint:

```ts
@Controller('coupons')
@Post('validate')
```

Prefer keeping checkout validation behind JWT if checkout already requires login.

- [ ] **Step 3: Register the coupon module in the application**

Wire entity/controller/service in the same style as other feature modules.

- [ ] **Step 4: Run backend tests for coupon module plus any affected payment tests**

Run: `rtk npm test -- --runInBand coupons`
Expected: PASS for the new coupon-focused tests.

## Task 6: Connect coupon usage consumption into successful purchase flow

**Files:**
- Modify: exact purchase completion service from Task 1
- Test: exact payment/enrollment spec from Task 1, or extend `coupons.service.spec.ts`

- [ ] **Step 1: Add a failing test for successful purchase consuming coupon usage**

Example expectation:

```ts
expect(couponsService.consumeCouponUsage).toHaveBeenCalledWith(createdCouponId);
```

- [ ] **Step 2: Call `consumeCouponUsage` only after payment success is persisted**

Do not call it during validation-only flows.

- [ ] **Step 3: Run the targeted payment/enrollment test**

Run: exact command based on discovered file.
Expected: PASS with coupon usage increment occurring once.

## Task 7: Build instructor coupon page hook and state flow

**Files:**
- Create: `frontend/src/pages/instructor/coupons/hooks/useInstructorCoupons.ts`

- [ ] **Step 1: Add hook interfaces for coupon rows, summary, and create payload**

Include fields for:

```ts
type CouponItem = {
  maCoupon: number;
  maCode: string;
  giaTriGiam: number;
  loaiGiam: 'PERCENT' | 'AMOUNT';
  trangThai: 'ACTIVE' | 'INACTIVE';
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maKH: number;
  tenKhoaHoc: string;
  soLuongGioiHan: number | null;
  soLuongDaDung: number;
  ghiChu: string | null;
};
```

- [ ] **Step 2: Implement load/list/create/toggle actions using `axiosClient`**

Endpoints:

```ts
GET /instructor/coupons
POST /instructor/coupons
PATCH /instructor/coupons/:id/status
GET /courses/my-courses
```

- [ ] **Step 3: Add local UI state for search, status filter, modal open, and form values**

- [ ] **Step 4: Run frontend typecheck for the new hook**

Run: `rtk npm run typecheck`
Expected: no type errors from the new hook.

## Task 8: Build the instructor coupon page UI from the draft

**Files:**
- Create: `frontend/src/pages/instructor/coupons/CouponManagement.tsx`

- [ ] **Step 1: Recreate the `draft/qlgiamgia.html` structure in React + Tailwind inside `InstructorLayout`**

Include:
- heading block
- create button
- stat cards
- search/filter bar
- coupon table
- modal form

- [ ] **Step 2: Bind modal form submission and inline field validation**

Required fields:
- course
- code
- discount type
- discount value

- [ ] **Step 3: Render empty/loading states consistent with other instructor pages**

- [ ] **Step 4: Run frontend typecheck after page creation**

Run: `rtk npm run typecheck`
Expected: PASS for the new page component.

## Task 9: Wire instructor navigation and routing

**Files:**
- Modify: `frontend/src/components/common/InstructorSidebar.tsx`
- Modify: `frontend/src/routes/InstructorRoutes.tsx`

- [ ] **Step 1: Add the sidebar item**

Add:

```ts
{ label: 'Mã giảm giá', path: '/instructor/coupons', icon: <Ticket size={18} /> }
```

- [ ] **Step 2: Add the route**

Add:

```tsx
<Route path="coupons" element={<InstructorCouponManagementPage />} />
```

- [ ] **Step 3: Run a quick frontend typecheck**

Run: `rtk npm run typecheck`
Expected: PASS with no route/sidebar errors.

## Task 10: Replace mocked checkout validation with live API

**Files:**
- Modify: `frontend/src/api/checkout.ts`
- Modify: `frontend/src/features/student-portal/pages/checkout/Checkout.tsx`

- [ ] **Step 1: Replace the mocked `validateCoupon` implementation**

Use:

```ts
const response = await axiosClient.post('/coupons/validate', {
  maCode: code,
  courseIds,
});
```

- [ ] **Step 2: Update checkout discount handling to trust backend `discountAmount`**

Behavior:
- keep entered code in state
- show backend message on success/failure
- apply returned `discountAmount`
- do not recalculate percentage differently in the UI

- [ ] **Step 3: Update the API types**

Use backend enum names:

```ts
discountType: 'PERCENT' | 'AMOUNT';
discountAmount: number;
matchedCourseId: number;
```

- [ ] **Step 4: Run frontend typecheck and build**

Run:
- `rtk npm run typecheck`
- `rtk npm run build`

Expected: PASS for checkout integration.

## Task 11: Update documentation

**Files:**
- Modify: `docs/api-contract.md`

- [ ] **Step 1: Add coupon endpoints and response expectations**

Document:
- `GET /instructor/coupons`
- `POST /instructor/coupons`
- `PATCH /instructor/coupons/:id/status`
- `POST /coupons/validate`

- [ ] **Step 2: Note multi-course coupon behavior**

Add one clear line that coupon discounts only the matching `MaKH` in cart.

## Task 12: Verification sweep

**Files:**
- No new files; verification only

- [ ] **Step 1: Run backend verification**

Run the narrowest passing commands available for coupon and affected payment flow.

- [ ] **Step 2: Run frontend verification**

Run:
- `rtk npm run lint`
- `rtk npm run typecheck`
- `rtk npm run build`

- [ ] **Step 3: Manual verification**

Check:
- instructor sees the new `Mã giảm giá` menu
- create coupon works
- inactive coupon cannot be applied
- active coupon applies only to the matching course in a multi-course cart
- usage count increases only after successful payment

- [ ] **Step 4: Prepare a focused summary of changed files and residual risks**

Mention any unverified payment path if the local environment cannot complete end-to-end purchase simulation.
