import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class KinhNghiemGiangVienDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  TenDonVi!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ChucVu!: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  NamBatDau?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  NamKetThuc?: number;

  @IsOptional()
  @IsBoolean()
  DangLamViec?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  MoTa?: string;
}
