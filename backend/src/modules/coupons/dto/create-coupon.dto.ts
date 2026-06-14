export class CreateCouponDto {
  maCode!: string;
  giaTriGiam!: number;
  loaiGiam!: 'PERCENT' | 'AMOUNT';
  trangThai?: 'ACTIVE' | 'INACTIVE';
  ngayBatDau?: string | null;
  ngayKetThuc?: string | null;
  maKH!: number;
  soLuongGioiHan?: number | null;
  ghiChu?: string | null;
}
