import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStudentReviewDto {
  @IsInt()
  @Min(1, { message: 'Đánh giá thấp nhất là 1 sao' })
  @Max(5, { message: 'Đánh giá cao nhất là 5 sao' })
  soSao: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  noiDung: string;
}
