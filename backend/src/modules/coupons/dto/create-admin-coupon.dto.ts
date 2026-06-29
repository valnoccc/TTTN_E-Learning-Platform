export type AdminCouponScopeType = 'ALL' | 'COURSE' | 'CATEGORY' | 'INSTRUCTOR';
export type AdminCouponRuleType =
  | 'NEW_USER_24H'
  | 'FIRST_PURCHASE'
  | 'COMBO_ONLY'
  | 'MIN_ORDER_VALUE'
  | 'MIN_COURSE_COUNT';
export type AdminCouponCampaignType =
  | 'FIRST_TIME'
  | 'CROSS_SELL'
  | 'HOLIDAY'
  | 'STANDARD';

export interface AdminCouponRuleInput {
  loaiDieuKien: AdminCouponRuleType;
  giaTriDieuKien?: number | null;
  moTa?: string | null;
}

export class CreateAdminCouponDto {
  maCode!: string;
  giaTriGiam!: number;
  loaiGiam!: 'PERCENT' | 'AMOUNT';
  trangThai?: 'ACTIVE' | 'INACTIVE';
  ngayBatDau?: string | null;
  ngayKetThuc?: string | null;
  soLuongGioiHan?: number | null;
  ghiChu?: string | null;
  maKM?: string | null;
  loaiKM?: AdminCouponCampaignType;
  scopeType?: AdminCouponScopeType;
  scopeTargetIds?: number[] | null;
  rules?: AdminCouponRuleInput[] | null;
}
