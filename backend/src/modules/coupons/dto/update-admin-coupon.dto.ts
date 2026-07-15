import type {
  AdminCouponRuleInput,
  AdminCouponScopeType,
} from './create-admin-coupon.dto';

/**
 * DTO cho chức năng Sửa mã giảm giá (Admin).
 *
 * Nhóm 1 — Luôn được phép sửa (bất kể soLuongDaDung):
 *   ghiChu, ngayKetThuc, soLuongGioiHan, trangThai
 *
 * Nhóm 2 — Chỉ được sửa khi soLuongDaDung === 0:
 *   maCode, loaiGiam, giaTriGiam, scopeType, scopeTargetIds, rules
 *
 * Backend sẽ kiểm tra soLuongDaDung và tự động bỏ qua các trường Nhóm 2
 * nếu mã đã có lượt sử dụng — ngay cả khi client gửi chúng lên.
 */
export class UpdateAdminCouponDto {
  // ── Nhóm 1: Luôn được sửa ────────────────────────────────────────────────

  /** Ghi chú / mô tả mã khuyến mãi */
  ghiChu?: string | null;

  /** Ngày kết thúc hiệu lực (ISO date string) */
  ngayKetThuc?: string | null;

  /**
   * Giới hạn tổng lượt sử dụng.
   * Khi giảm, giá trị mới KHÔNG được nhỏ hơn soLuongDaDung hiện tại.
   */
  soLuongGioiHan?: number | null;

  /** Trạng thái kích hoạt */
  trangThai?: 'ACTIVE' | 'INACTIVE';

  // ── Nhóm 2: Chỉ sửa được khi soLuongDaDung === 0 ─────────────────────────

  /** Mã code (VD: COMBO20, 24HNEW) — bị khóa nếu đã có lượt dùng */
  maCode?: string;

  /** Kiểu giảm giá — bị khóa nếu đã có lượt dùng */
  loaiGiam?: 'PERCENT' | 'AMOUNT';

  /** Giá trị giảm — bị khóa nếu đã có lượt dùng */
  giaTriGiam?: number;

  /** Loại phạm vi áp dụng — bị khóa nếu đã có lượt dùng */
  scopeType?: AdminCouponScopeType;

  /** Danh sách ID đối tượng áp dụng — bị khóa nếu đã có lượt dùng */
  scopeTargetIds?: number[] | null;

  /** Điều kiện áp dụng — bị khóa nếu đã có lượt dùng */
  rules?: AdminCouponRuleInput[] | null;
}
