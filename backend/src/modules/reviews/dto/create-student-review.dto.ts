import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsNoProfanity } from '../../../common/validators/is-no-profanity.validator';

export class CreateStudentReviewDto {
  @IsInt()
  @Min(1, { message: 'Đánh giá thấp nhất là 1 sao' })
  @Max(5, { message: 'Đánh giá cao nhất là 5 sao' })
  soSao: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  @IsNoProfanity()
  noiDung: string;
}
