import type {
  AdminCouponScopeType,
} from './create-admin-coupon.dto';
import { AdminCouponRuleInputDto } from './create-admin-coupon.dto';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';

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

  @IsOptional()
  @IsString()
  ghiChu?: string | null;

  @IsOptional()
  @IsString()
  ngayKetThuc?: string | null;

  @IsOptional()
  @IsNumber()
  soLuongGioiHan?: number | null;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  trangThai?: 'ACTIVE' | 'INACTIVE';

  // ── Nhóm 2: Chỉ sửa được khi soLuongDaDung === 0 ─────────────────────────

  @IsOptional()
  @IsString()
  maCode?: string;

  @IsOptional()
  @IsEnum(['PERCENT', 'AMOUNT'])
  loaiGiam?: 'PERCENT' | 'AMOUNT';

  @IsOptional()
  @IsNumber()
  giaTriGiam?: number;

  @IsOptional()
  @IsEnum(['ALL', 'COURSE', 'CATEGORY', 'INSTRUCTOR'])
  scopeType?: AdminCouponScopeType;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  scopeTargetIds?: number[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCouponRuleInputDto)
  rules?: AdminCouponRuleInputDto[] | null;
}
