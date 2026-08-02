import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { BangCapGiangVienDto } from './bang-cap-giang-vien.dto';
import { KinhNghiemGiangVienDto } from './kinh-nghiem-giang-vien.dto';

export class UpdateInstructorProfileDto {
  // --- Các trường cập nhật cho bảng NguoiDung ---
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  HoTen?: string;

  @IsOptional()
  @IsString()
  AnhDaiDien?: string;

  // --- Các trường cập nhật cho bảng HoSoGiangVien ---
  @IsOptional()
  @IsString()
  TieuSu?: string;

  @IsOptional()
  @IsString()
  ChuyenMon?: string;

  @IsOptional()
  @IsString()
  SoTaiKhoan?: string;

  @IsOptional()
  @IsString()
  MaNganHang?: string;

  @IsOptional()
  @IsString()
  TenNganHang?: string;

  @IsOptional()
  @IsString()
  TenChuTaiKhoan?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BangCapGiangVienDto)
  BangCaps?: BangCapGiangVienDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => KinhNghiemGiangVienDto)
  KinhNghiems?: KinhNghiemGiangVienDto[];

  @IsOptional()
  @IsString()
  FacebookURL?: string;

  @IsOptional()
  @IsString()
  InstagramURL?: string;

  @IsOptional()
  @IsString()
  GitHubURL?: string;

  @IsOptional()
  @IsString()
  WebsiteURL?: string;
}
