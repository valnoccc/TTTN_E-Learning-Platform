import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  Matches,
} from 'class-validator';

export class CreateLearningReminderDto {
  @IsOptional()
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsString()
  tenNhacNho?: string;

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
  cacThu?: string;

  @IsOptional()
  @IsString()
  ngayCuThe?: string;
}
