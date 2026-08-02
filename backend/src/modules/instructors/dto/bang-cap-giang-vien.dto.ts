import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class BangCapGiangVienDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  TenTruong!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  TenBangCap!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ChuyenNganh?: string;

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
}
