import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  Matches,
} from 'class-validator';

export class SyncCalendarDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  tenNhacNho: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['HANG_NGAY', 'HANG_TUAN', 'MOT_LAN'])
  tanSuat: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Thời gian phải đúng định dạng HH:mm hoặc HH:mm:ss',
  })
  thoiGian: string;

  @IsOptional()
  @IsString()
  // Ví dụ: "MO,WE,FR" hoặc "T2,T4,T6"
  cacThu?: string;

  @IsOptional()
  @IsString()
  // Chỉ dùng khi tanSuat === 'MOT_LAN', định dạng YYYY-MM-DD
  ngayCuThe?: string;

  @IsOptional()
  @IsNumber()
  courseId?: number;
}
