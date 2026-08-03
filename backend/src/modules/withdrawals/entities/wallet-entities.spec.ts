import { getMetadataArgsStorage } from 'typeorm';

import { LichSuGiaoDichViGiangVien } from './lich-su-giao-dich-vi-giang-vien.entity';
import { ViGiangVien } from './vi-giang-vien.entity';
import { YeuCauRutTien } from './yeu-cau-rut-tien.entity';

function getColumnNames(target: Function) {
  return getMetadataArgsStorage()
    .columns.filter((column) => column.target === target)
    .map((column) => String(column.options.name ?? column.propertyName));
}

describe('withdrawal wallet entities', () => {
  it('maps the instructor wallet balances', () => {
    expect(getColumnNames(ViGiangVien)).toEqual(
      expect.arrayContaining([
        'MaVi',
        'MaND',
        'SoDuKhaDung',
        'SoDuDangRut',
        'TongDoanhThu',
        'TongDaChi',
        'NgayCapNhat',
      ]),
    );
  });

  it('maps wallet history with an idempotency key', () => {
    expect(getColumnNames(LichSuGiaoDichViGiangVien)).toEqual(
      expect.arrayContaining([
        'MaLichSu',
        'MaVi',
        'MaND',
        'LoaiGiaoDich',
        'SoTien',
        'SoDuKhaDungTruoc',
        'SoDuKhaDungSau',
        'MaHoaDon',
        'MaKhoaHoc',
        'KhoaIdempotency',
      ]),
    );
  });

  it('maps withdrawal request payment snapshots and processing fields', () => {
    expect(getColumnNames(YeuCauRutTien)).toEqual(
      expect.arrayContaining([
        'MaYeuCauRut',
        'MaND',
        'SoTien',
        'SoTaiKhoan',
        'MaNganHang',
        'TenNganHang',
        'TenChuTaiKhoan',
        'TrangThai',
        'LyDoTuChoi',
        'MaGiaoDichNgoaiHeThong',
        'MaAdminXuLy',
      ]),
    );
  });
});
