import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  lyDo?: string;
}
