import { IsOptional, IsString, IsEnum, IsInt, Min, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum SapXepCauHoi {
  MOI_NHAT = 'MOI_NHAT',
  NHIEU_VIEW_NHAT = 'NHIEU_VIEW_NHAT',
  CHUA_TRA_LOI = 'CHUA_TRA_LOI',
}

export class FilterQuestionDto {
  @IsOptional()
  @IsString()
  tuKhoa?: string;

  @IsOptional()
  @IsEnum(SapXepCauHoi)
  sapXep?: SapXepCauHoi = SapXepCauHoi.MOI_NHAT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trang?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  soLuong?: number = 15;
}

export class CreateQuestionDto {
  @IsString()
  tieuDe!: string;

  @IsString()
  noiDung!: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  noiDung!: string;

  @IsOptional()
  @IsNumber()
  maCTL_Cha?: number;
}
