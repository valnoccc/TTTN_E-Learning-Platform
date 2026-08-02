import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { BangCapGiangVienDto } from '../../instructors/dto/bang-cap-giang-vien.dto';
import { KinhNghiemGiangVienDto } from '../../instructors/dto/kinh-nghiem-giang-vien.dto';

export class ApplyInstructorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  TieuSu!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ChuyenMon!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  SoTaiKhoan!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  MaNganHang!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  TenNganHang!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  TenChuTaiKhoan!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BangCapGiangVienDto)
  BangCaps?: BangCapGiangVienDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => KinhNghiemGiangVienDto)
  KinhNghiems?: KinhNghiemGiangVienDto[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  FacebookURL?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  InstagramURL?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  GitHubURL?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  WebsiteURL?: string;
}
