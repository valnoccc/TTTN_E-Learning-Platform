import { IsOptional, IsString } from 'class-validator';

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
