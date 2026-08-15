import { Type } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';

export type AdminCouponScopeType = 'ALL' | 'COURSE' | 'CATEGORY' | 'INSTRUCTOR';
export type AdminCouponRuleType =
  | 'NEW_USER_24H'
  | 'FIRST_PURCHASE'
  | 'COMBO_ONLY'
  | 'MIN_ORDER_VALUE'
  | 'MIN_COURSE_COUNT'
  | 'ACCOUNT_AGE_HOURS'
  | 'REPEAT_PURCHASE'
  | 'NEW_USER_ONLY';
export type AdminCouponCampaignType =
  | 'FIRST_TIME'
  | 'CROSS_SELL'
  | 'HOLIDAY'
  | 'STANDARD';

export class AdminCouponRuleInputDto {
  @IsEnum([
    'NEW_USER_24H',
    'FIRST_PURCHASE',
    'COMBO_ONLY',
    'MIN_ORDER_VALUE',
    'MIN_COURSE_COUNT',
    'ACCOUNT_AGE_HOURS',
    'REPEAT_PURCHASE',
    'NEW_USER_ONLY',
  ])
  loaiDieuKien!: AdminCouponRuleType;

  @IsOptional()
  @IsNumber()
  giaTriDieuKien?: number | null;

  @IsOptional()
  @IsString()
  moTa?: string | null;
}


export class CreateAdminCouponDto {
  @IsString()
  maCode!: string;

  @IsNumber()
  giaTriGiam!: number;

  @IsEnum(['PERCENT', 'AMOUNT'])
  loaiGiam!: 'PERCENT' | 'AMOUNT';

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  trangThai?: 'ACTIVE' | 'INACTIVE';

  @IsOptional()
  @IsString()
  ngayBatDau?: string | null;

  @IsOptional()
  @IsString()
  ngayKetThuc?: string | null;

  @IsOptional()
  @IsNumber()
  soLuongGioiHan?: number | null;

  @IsOptional()
  @IsString()
  ghiChu?: string | null;

  @IsOptional()
  @IsString()
  maKM?: string | null;

  @IsOptional()
  @IsEnum(['FIRST_TIME', 'CROSS_SELL', 'HOLIDAY', 'STANDARD'])
  loaiKM?: AdminCouponCampaignType;

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
